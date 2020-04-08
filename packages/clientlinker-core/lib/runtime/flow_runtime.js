'use strict';

const debug = require('debug')('clientlinker:flow_runtime');
const utils = require('../utils');

class FlowRuntime {
	constructor(flow, onetry) {
		this.flow = flow;
		this.onetry = onetry;
		this.runtime = onetry.runtime;
		this._nextRunnerPromise = null;
	}

	async run() {
		try {
			debug('flow run:%s', this.flow.name);
			// 必须要用await，否则直接return Promise.reject 无法捕获到
			const ret = await this.flow.run(this.runtime, this);
			return ret;
		} catch (err) {
			throw this._error(err);
		}
	}

	async next() {
		if (!this._nextRunnerPromise) {
			const nextRunner = this.onetry.nextRunner();
			if (nextRunner) {
				debug('nextRunner:%s', nextRunner.flow.name);
				this._nextRunnerPromise = nextRunner.run();
			} else {
				const runtime = this.runtime;
				debug('flow out: %s', runtime.action);
				throw utils.newNotFoundError('CLIENT FLOW OUT', runtime)
			}
		} else {
			debug('next handler run twice');
		}

		return this._nextRunnerPromise;
	}

	toJSON() {
		return {
			name: this.flow.name,
		};
	}

	_error(err) {
		const client = this.runtime.client;
		if (client.options.anyToError)
			err = client.linker.anyToError(err, this);

		// 方便定位问题
		if (
			err &&
			client.options.exportErrorInfo !== false &&
			!err.fromClient &&
			!err.CLIENTLINKER_TYPE &&
			typeof err == 'object'
		) {
			utils.expandError(err, this.runtime, this.flow.name);
		}

		return err;
	}

}

exports.FlowRuntime = FlowRuntime;
