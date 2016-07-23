var Promise		= require('bluebird');
var debug		= require('debug')('client_linker:client');
var isPromise	= require('is-promise');
var FlowRun		= require('./flow_run').FlowRun;


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
		if (!clientFlows || !clientFlows.length) return Promise.reject('CLIENTLINKER:CLIENT NO FLOWS,'+self.name);

		var retry;
		if (runtime.runOptions && 'retry' in runtime.runOptions)
			retry = runtime.runOptions.retry;
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
		var flowRun = new FlowRun(runtime);
		runtime.retry.push(flowRun);
		return flowRun.run();
	},

	methods: function()
	{
		var self = this;
		var clientFlows = self.options.flows;
		var linkerFlows = self.linker.flows;

		if (!clientFlows) return Promise.resolve([]);

		var promises = clientFlows.map(function(handler)
			{
				if (typeof handler == 'string')
					handler = linkerFlows[handler];
				
				if (handler && typeof handler.methods == 'function')
				{
					var list = handler.methods(self);
					if (isPromise(list))
					{
						return list.then(function(list)
							{
								if (list)
								{
									return {
										flow: handler,
										methods: list
									};
								}
							},
							// 屏蔽错误
							function(err)
							{
								debug('read methods err,flow:%s err:%o', handler.name, err);
							});
					}
					else if (list)
					{
						return {
							flow: handler,
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
					item.methods.forEach(function(methodName)
					{
						var methodInfo = list[methodName] || (list[methodName] = []);
						methodInfo.push(item.flow);
					});
				});

				return list;
			});
	},
};

