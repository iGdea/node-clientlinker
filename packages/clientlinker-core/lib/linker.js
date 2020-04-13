'use strict';

const _ = require('lodash');
const debug = require('debug')('clientlinker:linker');
const Client = require('./client').Client;
const Flow = require('./flow').Flow;
const Runtime = require('./runtime/client_runtime').ClientRuntime;
const utils = require('./utils');
// const depLinker = require('./deps/dep_linker');

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

		// depLinker.init.call(this);
	}

	client(clientName, options) {
		if (typeof clientName != 'string') {
			throw new Error(
				'CLIENTLINKER:ClientNameMustBeString,' + clientName
			);
		}
		if (arguments.length == 1) {
			debug('get client instead of set');
			return this._clients[clientName];
		}
		if (typeof options != 'object') {
			throw new Error(
				'CLIENTLINKER:ClientOptionsMustBeObject,' + clientName
			);
		}

		const defaultFlowOptions = options &&
			!options.flows &&
			this.options.defaults &&
			this.options.defaults.flows && {
				flows: this.options.defaults.flows.slice()
			};

		options = _.extend(
			{},
			this.options.defaults,
			defaultFlowOptions,
			options
		);

		if (!options.flows) options.flows = [];

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
			debug('get client instead of set');
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
		/* eslint no-unused-vars: off */
		return this.runIn(arguments, 'run');
	}

	async runIn(args, source, env) {
		const action = args[0];
		let callback = args[3];
		let options = args[4];

		if (process.domain) debug('run by domain: %s', action);

		if (typeof callback != 'function') {
			if (callback && args.length < 5) {
				options = callback;
			}

			callback = null;
		}

		const runtime = new Runtime(this, action, args[1], args[2], options);
		if (env) runtime.env = env;

		// 通过这种手段，同步情况下，暴露runtime
		// runtime保存着运行时的所有数据，方便进行调试
		this.lastRuntime = runtime;

		// 执行逻辑放到下一个event loop，runtime在当前就可以获取到，逻辑更加清晰
		// 也方便run之后，对runtime进行参数调整：clientlinker-flow-httpproxy修改tmp变量
		const data = await this._parseAction(action);

		runtime.method = data.method;
		runtime.client = data.client;
		runtime.env.source = source;

		const retPromise = runtime.run();
		// 兼容callback
		if (callback) {
			// 增加process.nextTick，防止error被promise捕捉到
			retPromise.then(
				data => process.nextTick(() => callback(null, data)),
				err => process.nextTick(() => callback(err || utils.DEFAULT_ERROR))
			);
		}

		return retPromise;
	}

	// 解析action
	async parseAction(action) {
		return this._parseAction(action);
	}

	_parseAction(action) {
		const list = this._clients;
		const info = utils.parseAction(action);

		return {
			client: list[info.clientName],
			method: info.method
		};
	}

	// 罗列methods
	async methods() {
		const clients = this._clients;

		const promises = _.map(clients, async function(client) {
			const methodList = await client.methods();
			return {
				client: client,
				methods: methodList
			};
		});

		const list = await Promise.all(promises);

		// 整理
		const map = {};
		list.forEach(function(item) {
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
			_.each(clients, function(item) {
				item.cache = {};
			});
		}
	}
}

exports.Linker = Linker;


Linker.prototype.JSON = utils.JSON;
Linker.prototype.version = require('../package.json').version;
Linker.prototype.anyToError = utils.anyToError;

// depLinker.proto(Linker);
