'use strict';

const _ = require('lodash');
const FlowsRuntime = require('./flows_runtime').FlowsRuntime;
const utils = require('../utils');
const { EventEmitter } = require('events');

class ClientRuntime extends EventEmitter {
	constructor(linker, action, query, body, options) {
		super();

		this.linker = linker;
		this.action = action;
		this.client = null;
		this.method = null;

		// 如果使用httpproxy，必须是可以被序列化的
		this.query = query;
		// 如果使用httpproxy，必须是可以被序列化的
		this.body = body;
		// 如果使用httpproxy，必须是可以被序列化的
		this.options = options;
		// 保存框架运行过程中的数据
		// 如果使用httpproxy，必须是可以被序列化的
		this.env = {};
		// 保存运行过程中的数据，和env区别：会在重试的时候清理
		// 比如httproxy运行次数
		// 如果使用httpproxy，必须是可以被序列化的
		this.tmp = {};

		// 执行过程中额外生成的一些数据
		this._debugData = {};

		// 运行中的状态
		this.retry = [];
		this.lastTry = null;
		this.promise = null;
	}

	run() {
		if (!this.client) throw utils.newNotFoundError('NO CLIENT', this);

		const mainPromise = this._run();
		// 清理绑定事件
		mainPromise.catch(_.noop).then(() => {
			this.removeAllListeners();
		});

		return mainPromise;
	}

	_run() {
		const onetry = new FlowsRuntime(this);
		this.lastTry = onetry;
		this.tmp = {};
		this.retry.push(onetry);
		this.emit('retry');

		let promise = onetry.run();

		const retry = this.options && this.options.retry || this.client.options.retry;
		if (this.retry.length < retry) {
			promise = promise.catch(() => this._run());
		}

		return promise;
	}

	debug(key, val) {
		const data = this._debugData;
		switch (arguments.length) {
			case 0:
				return data;

			case 1: {
				let arr = data[key];
				return arr && arr[arr.length - 1].value;
			}

			case 2:
			default: {
				let arr = data[key] || (data[key] = []);
				arr.push(new DebugData(val, this));
			}
		}
	}

	getLastRunner() {
		return this.lastTry && this.lastTry.lastRunner;
	}

	getFirstRunner() {
		const firstTry = this.retry[0];
		return firstTry && firstTry.runned[0];
	}

	isStarted() {
		const firstTry = this.retry[0];
		return firstTry && firstTry.started;
	}

	isFinished() {
		return this.lastTry && this.lastTry.finished;
	}

	toJSON() {
		const debugData = {};
		_.each(this._debugData, (vals, key) => {
			debugData[key] = vals.map(item => {
				return item.toJSON();
			});
		});

		return {
			action: this.action,
			query: this.query,
			body: this.body,
			options: this.options,

			client: this.client && this.client.name,
			env: this.env,
			debugData: debugData,

			retry: this.retry.map(item => {
				return item.toJSON();
			}),

			started: this.isStarted(),
			finished: this.isFinished()
		};
	}
}

exports.ClientRuntime = ClientRuntime;

class DebugData {
	constructor(value, runtime) {
		this.value = value;
		this.retry = runtime.retry.length;
		this.runner = runtime.getLastRunner();
	}

	toJSON() {
		return {
			value: this.value,
			retry: this.retry,
			flow: this.runner.flow.name
		};
	}
}

// require('../deps/dep_client_runtime').proto(ClientRuntime);
