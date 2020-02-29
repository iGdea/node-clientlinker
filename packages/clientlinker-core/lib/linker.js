'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const debug = require('debug')('clientlinker:linker');
const Client = require('./client').Client;
const Flow = require('./flow').Flow;
const Runtime = require('./runtime/client_runtime').ClientRuntime;
const utils = require('./utils');
const depLinker = require('./deps/dep_linker');
class Linker {
	constructor(options) {
		this._clients = {};
		this._initProcessPromise = Promise.resolve();
		this.flows = {};
		// 包含初始化client的一些配置
		this.options = options || {};
		// 用来暴露最近一次执行runIn时，返回的runtime对象
		this.lastRuntime = null;

		// flow 可能会放一些缓存变量在这里
		this.cache = {};

		depLinker.init.call(this);
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

	onInit(checkHandler) {
		const self = this;
		self._initProcessPromise = Promise.all([
			self._initProcessPromise,
			checkHandler(self)
		]);
	}

	// 标准输入参数
	run(action, query, body, callback, options) {
		/* eslint no-unused-vars: off */
		return this.runIn(arguments, 'run');
	}

	runInShell() {
		return this.runIn(arguments, 'shell');
	}

	async runIn(args, source, env) {
		const self = this;
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

		const runtime = new Runtime(self, action, args[1], args[2], options);

		// 通过这种手段，同步情况下，暴露runtime
		// runtime保存着运行时的所有数据，方便进行调试
		self.lastRuntime = runtime;

		const arr = await Promise.all([
			self.parseAction(action),
			// 执行逻辑放到下一个event loop，runtime在当前就可以获取到，逻辑更加清晰
			// 也方便run之后，对runtime进行参数调整：clientlinker-flow-httpproxy修改tmp变量
			new Promise(process.nextTick)
		]);

		const data = arr[0];
		runtime.method = data.method;
		runtime.client = data.client;
		if (env) _.extend(runtime.env, env);
		runtime.env.source = source;

		return self._runByRuntime(runtime, callback);
	}

	_runByRuntime(runtime, callback) {
		const retPromise = runtime.run();

		// 兼容callback
		if (callback) {
			retPromise.then(
				function(data) {
					// 增加process.nextTick，防止error被promise捕捉到
					process.nextTick(function() {
						callback(null, data);
					});
				},
				function(ret) {
					process.nextTick(function() {
						callback(ret || utils.DEFAULT_ERROR);
					});
				}
			);
		}

		return retPromise;
	}

	// 解析action
	async parseAction(action) {
		const list = await this.clients();
		const info = utils.parseAction(action);

		return {
			client: list[info.clientName],
			method: info.method
		};
	}

	// 罗列methods
	async methods() {
		const clients = await this.clients();

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

	clients() {
		const self = this;
		const clientPromise = self._initProcessPromise;

		return clientPromise.then(function() {
			if (self._initProcessPromise === clientPromise)
				return self._clients;
			else return self.clients();
		});
	}

	async clearCache(clientName) {
		if (!clientName) this.cache = {};

		const clients = await this.clients();

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

depLinker.proto(Linker);
