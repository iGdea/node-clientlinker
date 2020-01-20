'use strict';

let _ = require('lodash');
let Promise = require('bluebird');
let debug = require('debug')('clientlinker:flows_runtime');
let FlowRuntime = require('./flow_runtime').FlowRuntime;
let Timing = require('./timing/flows_runtime_timing').Timing;
let utils = require('../utils');

exports.FlowsRuntime = FlowsRuntime;
function FlowsRuntime(runtime) {
	this.runtime = runtime;
	this.runned = [];
	this.lastRunner = null;
	this.started = false;
	this.finished = false;
	this.timing = new Timing(this);
}

_.extend(FlowsRuntime.prototype, {
	run: function() {
		let self = this;
		self.started = true;
		self.finished = false;

		let promise = self.run_();
		promise
			.finally(function() {
				self.finished = true;
			})
			// 避免 Unhandled rejection Error 提示
			.catch(_.noop);

		return promise;
	},

	getFlowRuntime: function(name) {
		let list = this.runned;
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
	},

	run_: function() {
		let self = this;
		let runtime = self.runtime;
		let client = runtime.client;
		let clientFlows = client.options.flows;
		let runner = self.nextRunner();

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
	},

	nextRunner: function() {
		let flow;
		let client = this.runtime.client;

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

		let runner = new FlowRuntime(flow, this);
		this.runned.push(runner);
		this.lastRunner = runner;

		return runner;
	},

	toJSON: function() {
		return {
			runned: this.runned.map(function(item) {
				return item.toJSON();
			}),

			started: this.started,
			finished: this.finished,
			timing: this.timing.toJSON()
		};
	}
});

require('../deps/dep_flows_runtime').proto(FlowsRuntime);
