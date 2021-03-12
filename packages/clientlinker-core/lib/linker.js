const _ = require('lodash');
const debug = require('debug')('clientlinker:linker');
const { Client } = require('./client');
const { Flow } = require('./flow');
const { ClientRuntime } = require('./runtime/client_runtime');
const utils = require('./utils');

class Linker {
	constructor(options) {
		this._clients = {};
		this.flows = {};
		// 包含初始化client的一些配置
		this.options = options || {};
		// 用来暴露最近一次执行runIn时，返回的runtime对象
		this.lastRuntime = null;

		// flow 可能会放一些缓存变量在这里
		this.cache = {};
	}

	client(clientName, options) {
		if (typeof clientName != 'string') {
			throw new Error(
				'CLIENTLINKER:ClientNameMustBeString,' + clientName
			);
		}
		if (arguments.length == 1) {
			return this._clients[clientName];
		}
		if (typeof options != 'object') {
			throw new Error(
				'CLIENTLINKER:ClientOptionsMustBeObject,' + clientName
			);
		}

		options = {
			...this.options.defaults,
			...options
		};

		if (!options.flows) options.flows = [];
		else options.flows = options.flows.slice();

		const client = (this._clients[clientName] = new Client(
			clientName,
			this,
			options
		));
		debug('add client:%s', clientName);

		return client;
	}

	// 注册flower
	flow(flowName, handler) {
		if (typeof flowName != 'string') {
			throw new Error('CLIENTLINKER:FlowNameMustBeString,' + flowName);
		} else if (arguments.length == 1) {
			return this.flows[flowName];
		} else if (typeof handler != 'function') {
			throw new Error(
				'CLIENTLINKER:FlowHandlerMustBeFunction,' + flowName
			);
		}

		const flow = new Flow(flowName);
		handler(flow, this);

		if (typeof flow.run != 'function') {
			throw new Error('CLIENTLINKER:Flow.runMustBeFunction,' + flowName);
		}

		if (flow.methods && typeof flow.methods != 'function') {
			throw new Error(
				'CLIENTLINKER:Flow.methodsMustBeFunction,' + flowName
			);
		}

		this.flows[flowName] = flow;

		return flow;
	}

	// 标准输入参数
	run(action, query, body, options) {
		return this.runIn(action, query, body, options);
	}

	// 相比run，多了env
	runIn(action, query, body, options, env) {
		const runtime = this._runtime(action, query, body, options, env);
		if (!runtime.client) {
			return Promise.reject(utils.newNotFoundError('NO CLIENT', runtime));
		}

		// 通过这种手段，同步情况下，暴露runtime
		// runtime保存着运行时的所有数据，方便进行调试
		this.lastRuntime = runtime;

		return runtime.run_();
	}

	runtime() {
		const runtime = this._runtime.apply(this, arguments);

		// 直接使用Promise包裹，比async性能好
		return runtime.client
			? Promise.resolve(runtime)
			: Promise.reject(utils.newNotFoundError('NO CLIENT', runtime))
	}

	_runtime(action, query, body, options, env) {
		const data = this._parseAction(action);

		const runtime = new ClientRuntime(this, action, query, body, options);
		if (env) runtime.env = env;
		runtime.method = data.method;
		runtime.client = data.client;

		return runtime;
	}

	// 解析action
	async parseAction(action) {
		return this._parseAction(action);
	}

	_parseAction(action) {
		const info = utils.parseAction(action);

		return {
			client: this._clients[info.clientName],
			method: info.method
		};
	}

	// 罗列methods
	async methods() {
		const clients = this._clients;

		const promises = _.map(clients, async (client) => {
			const methodList = await client.methods();
			return {
				client: client,
				methods: methodList
			};
		});

		const list = await Promise.all(promises);

		// 整理
		const map = {};
		list.forEach(item => {
			map[item.client.name] = item;
		});

		return map;
	}

	async clients() {
		return this._clients;
	}

	async clearCache(clientName) {
		if (!clientName) this.cache = {};

		const clients = this._clients;

		if (clientName) {
			const client = clients[clientName];
			if (client) client.cache = {};
		} else {
			_.each(clients, item => {
				item.cache = {};
			});
		}
	}
}

exports.Linker = Linker;


Linker.prototype.JSON = utils.JSON;
Linker.prototype.version = require('../package.json').version;
