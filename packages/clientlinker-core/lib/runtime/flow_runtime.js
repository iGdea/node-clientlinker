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
		return this.flow.run(this.runtime, this);
	}

	next() {
		if (!this._nextRunnerPromise) {
			const nextRunner = this.onetry.nextRunner();
			if (nextRunner) {
				debug('nextRunner:%s', nextRunner.flow.name);
				this._nextRunnerPromise = nextRunner.run();
			} else {
				const runtime = this.runtime;
				debug('flow out: %s', runtime.action);
				return Promise.reject(utils.newNotFoundError('CLIENT FLOW OUT', runtime));
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
