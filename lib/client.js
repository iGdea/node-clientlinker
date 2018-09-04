'use strict';

var _			= require('lodash');
var Promise		= require('bluebird');
var debug		= require('debug')('clientlinker:client');


exports.Client = Client;
function Client(name, linker, options)
{
	this.name = name;
	this.linker = linker;
	this.options = options || {};
}

_.extend(Client.prototype,
{
	run: function(runtime)
	{
		// var self = this;
		// var clientFlows = self.options.flows;
		// if (!clientFlows || !clientFlows.length)
		// {
		// 	var err = new Error('CLIENTLINKER:NotFound,'+self.name);
		// 	err.CLIENTLINKER_TYPE = 'CLIENT NO FLOWS';
		// 	err.CLIENTLINKER_CLIENT = self.name;
		// 	err.CLIENTLINKER_ACTION = runtime.action;
		//
		// 	debug('not found flows options: %s', runtime.action);
		// 	return Promise.reject(err);
		// }

		return runtime.run();
	},

	methods: function()
	{
		var self = this;
		var clientFlows = self.options.flows;
		if (!clientFlows) return Promise.resolve([]);

		var promises = clientFlows.map(function(flowName)
		{
			var flow = self.linker.flow(flowName);
			if (!flow) return;

			return Promise.resolve(flow.methods(self))
				.then(function(list)
				{
					if (!list)
					{
						debug('no method inifo: %s', flowName);
						return;
					}

					return {
						flow: flow,
						methods: list
					};
				});
		});

		return Promise.all(promises)
			.then(function(methodList)
			{
				var map = {};
				methodList.forEach(function(item)
				{
					if (!item) return;
					item.methods.forEach(function(method)
					{
						var methodInfo = map[method] || (map[method] = []);
						methodInfo.push(item.flow);
					});
				});

				return map;
			});
	},
});
