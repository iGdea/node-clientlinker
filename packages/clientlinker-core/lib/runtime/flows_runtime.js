'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const debug = require('debug')('clientlinker:flows_runtime');
const FlowRuntime = require('./flow_runtime').FlowRuntime;
const utils = require('../utils');

class FlowsRuntime {
	constructor(runtime) {
		this.runtime = runtime;
		this.runned = [];
		this.lastRunner = null;
		this.started = false;
		this.finished = false;
	}

	run() {
		const self = this;
		self.started = true;
		self.finished = false;

		const promise = self.run_();
		promise
			.finally(function() {
				self.finished = true;
			})
			// 避免 Unhandled rejection Error 提示
			.catch(_.noop);

		return promise;
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

	run_() {
		const self = this;
		const runtime = self.runtime;
		const client = runtime.client;
		const clientFlows = client.options.flows;
		const runner = self.nextRunner();

		if (!runner) {
			debug('flow out: %s', runtime.action);
			return Promise.reject(
				utils.newNotFoundError('CLIENT NO FLOWS', runtime)
			);
		}

		debug(
			'run %s.%s flow:%s(%d/%d)',
			client.name,
			runtime.method,
			runner.flow.name,
			self.runned.length,
			clientFlows.length
		);

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
			flow = client.linker.flow(flowName);
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
			runned: this.runned.map(function(item) {
				return item.toJSON();
			}),

			started: this.started,
			finished: this.finished,
		};
	}
}

exports.FlowsRuntime = FlowsRuntime;

require('../deps/dep_flows_runtime').proto(FlowsRuntime);
