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
		var timing = {navigationStart: runtime.navigationStart};
		var retryInfo = {timing: timing};

		runtime.timing = timing;
		runtime.retry.push(retryInfo);

		var promise = this.runFlows_(new FlowRun(runtime));
		retryInfo.promise = promise;

		return promise;
	},
	runFlows_: function(flowRun)
	{
		var self = this;
		var runtime = flowRun.runtime;
		var timing = runtime.timing;
		var clientFlows = self.options.flows;
		var flow = flowRun.next();

		if (!flow) return Promise.reject('CLIENTLINKER:CLIENT FLOW OUT,'+self.name+'.'+runtime.methodName+','+clientFlows.length);

		debug('run %s.%s flow:%s(%d/%d)', self.name, runtime.methodName, flow.name, flowRun.flowIndex+1, clientFlows.length);
		
		var callback = flowRun.callbackDefer();
		var startTime = timing.lastFlowStart = Date.now();
		timing['flowStart_'+flow.name] = startTime;
		if (flowRun.inited)
		{
			timing.flowsStart = startTime;
			runtime.promise = callback.promise;
		}

		try {
			var ret = flow.call(this, runtime, callback);
			if (isPromise(ret)) ret.catch(callback.reject);
		}
		catch(err)
		{
			callback.reject(err);
		}

		return callback.promise;
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

