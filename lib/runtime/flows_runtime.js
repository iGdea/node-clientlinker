'use strict';

var _			= require('lodash');
var Promise		= require('bluebird');
var debug		= require('debug')('clientlinker:flows_runtime');
var FlowRuntime	= require('./flow_runtime').FlowRuntime;
var Timing		= require('./flow_runtime_timing').Timing;
var utils		= require('../utils');


exports.FlowsRuntime = FlowsRuntime;
function FlowsRuntime(runtime)
{
	this.runtime = runtime;
	this.runned = [];
	this.lastRunner = null;
	this.started = false;
	this.finished = false;
	this.timing = new Timing(this);
}

_.extend(FlowsRuntime.prototype,
{
	run: function()
	{
		var self = this;
		self.started = true;
		self.finished = false;

		var promise = self.run_();
		promise.finally(function(){self.finished = true})
			// 避免 Unhandled rejection Error 提示
			.catch(_.noop);

		return promise;
	},

	getFlowRuntime: function(name)
	{
		var list = this.runned;
		var index = list.length;
		while(index--)
		{
			if (list[index]
				&& list[index].flow
				&& list[index].flow.name == name)
			{
				return list[index];
			}
		}
	},

	run_: function()
	{
		var self = this;
		var runtime = self.runtime;
		var client = runtime.client;
		var clientFlows = client.options.flows;
		var runner = self.nextRunner();

		if (!runner)
		{
			debug('flow out: %s', runtime.action);
			return Promise.reject(utils.newNotFoundError('CLIENT NO FLOWS', runtime));
		}

		self.lastRunner = runner;

		debug('run %s.%s flow:%s(%d/%d)',
			client.name,
			runtime.method,
			runner.flow.name,
			self.runned.length,
			clientFlows.length);

		return runner.run();
	},

	nextRunner: function()
	{
		var flow;
		var client = this.runtime.client;

		for(var flowName,
			clientFlows = client.options.flows,
			index = this.runned.length;
			(flowName = clientFlows[index]);
			index++)
		{
			flow = client.linker.flow(flowName);
			if (flow) break;
			this.runned.push(null);
		}

		if (!flow) return;

		var runner = new FlowRuntime(flow, this);
		this.runned.push(runner);
		return runner;
	},
});

require('../deps/dep_flows_runtime').proto(FlowsRuntime);
