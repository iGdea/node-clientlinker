'use strict';

var Promise		= require('bluebird');
var debug		= require('debug')('clientlinker:client');
var isPromise	= require('is-promise');
var FlowsRun	= require('./flows_run').FlowsRun;


exports.Client = Client;
function Client(name, linker, options)
{
	this.name = name;
	this.linker = linker;
	this.options = options || {};
}

Client.prototype = {
	run: function(runtime)
	{
		var self = this;
		var clientFlows = self.options.flows;
		if (!clientFlows || !clientFlows.length)
		{
			var err = new Error('CLIENTLINKER:NotFound,'+self.name);
			err.CLIENTLINKER_TYPE = 'CLIENT NO FLOWS';
			err.CLIENTLINKER_CLIENT = self.name;
			err.CLIENTLINKER_ACTION = runtime.action;

			return Promise.reject(err);
		}

		var retry;
		if (runtime.options && runtime.options.retry)
			retry = runtime.options.retry;
		else
			retry = self.options.retry;

		return self._run(runtime)
				.catch(function(err)
				{
					if (runtime.retry.length < retry)
						return self._run(runtime);
					else
						throw err;
				});
	},
	_run: function(runtime)
	{
		var flowsRun = new FlowsRun(runtime);
		runtime.retry.push(flowsRun);
		return flowsRun.run();
	},

	methods: function()
	{
		var self = this;
		var clientFlows = self.options.flows;
		if (!clientFlows) return Promise.resolve([]);

		var promises = clientFlows.map(function(flowName)
			{
				var flow = self.linker.getFlow(flowName);

				if (flow && typeof flow.methods == 'function')
				{
					var list = flow.methods(self);
					if (isPromise(list))
					{
						return list.then(function(list)
							{
								if (list)
								{
									return {
										flow: flow,
										methods: list
									};
								}
							},
							// 屏蔽错误
							function(err)
							{
								debug('read methods err,flow:%s err:%o', flow.name, err);
							});
					}
					else if (list)
					{
						return {
							flow: flow,
							methods: list
						}
					}
				}
			});

		return Promise.all(promises)
			.then(function(methodList)
			{
				var list = {};
				methodList.forEach(function(item)
				{
					if (!item) return;
					item.methods.forEach(function(method)
					{
						var methodInfo = list[method] || (list[method] = []);
						methodInfo.push(item.flow);
					});
				});

				return list;
			});
	},
};
