const debug = require('debug')('clientlinker:flows_runtime');
const { FlowRuntime } = require('./flow_runtime');
const utils = require('../utils');

class FlowsRuntime {
	constructor(runtime) {
		this.runtime = runtime;
		this.runned = [];
		this.lastRunner = null;
	}

	getFlowRuntime(name) {
		const list = this.runned;
		let index = list.length;
		while (index--) {
			if (
				list[index] &&
				list[index].flow &&
				list[index].flow.name == name
			) {
				return list[index];
			}
		}
	}

	run() {
		const runner = this.nextRunner();

		if (!runner) {
			const runtime = this.runtime;
			debug('flow out: %s', runtime.action);
			return Promise.reject(utils.newNotFoundError('CLIENT NO FLOWS', runtime));
		}

		// const client = runtime.client;
		// const clientFlows = client.options.flows;
		// debug(
		// 	'run %s.%s flow:%s(%d/%d)',
		// 	client.name,
		// 	runtime.method,
		// 	runner.flow.name,
		// 	this.runned.length,
		// 	clientFlows.length
		// );

		return runner.run();
	}

	nextRunner() {
		let flow;
		const client = this.runtime.client;

		for (
			let flowName,
				clientFlows = client.options.flows,
				index = this.runned.length;
			(flowName = clientFlows[index]);
			index++
		) {
			flow = client.linker.flows[flowName];
			if (flow) break;
			this.runned.push(null);
		}

		if (!flow) return;

		const runner = new FlowRuntime(flow, this);
		this.runned.push(runner);
		this.lastRunner = runner;

		return runner;
	}

	toJSON() {
		return {
			runned: this.runned.map(item => {
				return item.toJSON();
			}),
		};
	}
}

exports.FlowsRuntime = FlowsRuntime;
