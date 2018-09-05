'use strict';

var _			= require('lodash');
var Promise		= require('bluebird');
var debug		= require('debug')('clientlinker:flows_runtime');
var Flow		= require('../flow').Flow;
var FlowRuntime	= require('./flow_runtime').FlowRuntime;

var FlowOutError = new Flow('FlowOutError');
FlowOutError.register(function(runtime)
{
	var err = new Error('CLIENTLINKER:NotFound,'+runtime.action);

	err.CLIENTLINKER_TYPE = 'CLIENT FLOW OUT';
	err.CLIENTLINKER_ACTION = runtime.action;
	err.CLIENTLINKER_CLIENT = runtime.client.name;
	debug('flow out: %s', runtime.action);

	return Promise.reject(err);
});


exports.FlowsRuntime = FlowsRuntime;
function FlowsRuntime(runtime)
{
	this.runtime = runtime;
	this.runned = [];
	this.lastRunner = null;
	this.started = false;
	this.finished = false;
}

_.extend(FlowsRuntime.prototype,
{
	FlowOutError: FlowOutError,
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

		if (!flow) flow = this.FlowOutError;

		var runner = new FlowRuntime(flow, this);
		this.runned.push(runner);
		return runner;
	},
});
