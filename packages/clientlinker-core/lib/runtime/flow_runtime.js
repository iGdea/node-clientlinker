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
		return this.run_();
	}

	// 对内接口，直接去掉async
	run_() {
		return this.flow.run(this.runtime, this);
	}

	// 对外接口，使用async
	async next() {
		if (!this._nextRunnerPromise) {
			const nextRunner = this.onetry.nextRunner();
			if (nextRunner) {
				debug('nextRunner:%s', nextRunner.flow.name);
				this._nextRunnerPromise = Promise.resolve(nextRunner.run_());
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
}

exports.FlowRuntime = FlowRuntime;
