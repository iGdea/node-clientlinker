var Promise		= require('bluebird');

exports.FlowRun = FlowRun;
function FlowRun(runtime)
{
	this.runtime = runtime;
	this.flowIndex = -1;
	this.inited = true;
	this.currentFlow = null;
}

FlowRun.prototype = {
	
	next: function()
	{
		var flow;
		var client = this.runtime.client;
		this.inited = this.flowIndex == -1;
		this.flowIndex++;

		for(var linkerFlows = client.linker.flows,
			clientFlows = client.options.flows;
			flow = clientFlows[this.flowIndex];
			this.flowIndex++)
		{
			var type = typeof flow;
			if (type == 'string')
			{
				flow = linkerFlows[flow];
				type = typeof flow;
			}
			
			if (type == 'function') break;
		}

		this.currentFlow = flow;

		return flow;
	},
	// 注意：要保持当前的状态
	// 中间有异步的逻辑，可能导致状态改变
	callbackDefer: function()
	{
		var self	= this;
		var client	= self.runtime.client;
		var flow	= self.currentFlow;
		var inited	= self.inited;

		var resolve, reject;
		var promise = new Promise(function(resolve0, reject0)
				{
					resolve = resolve0;
					reject = reject0;
				})
				.then(function(data)
				{
					self.timeEnd(flow, inited);
					return data;
				},
				function(err)
				{
					self.timeEnd(flow, inited);

					// 将错误信息转化为Error对象
					if (client.options.anyToError && !(err instanceof Error))
					{
						err = client.linker.anyToError(err);
					}

					// 方便定位问题
					if (err && typeof err == 'object')
					{
						err.fromClient || (err.fromClient = self.runtime.client.name);
						err.fromClientFlow || (err.fromClientFlow = flow.name);
						err.fromClientMethod || (err.fromClientMethod = self.runtime.methodName);
					}

					throw err;
				});

		function callback(ret, data)
		{
			ret ? callback.reject(ret) : callback.resolve(data);
		}

		function next(async)
		{
			var promise = client.runFlows_(self);
			if (!async) promise.then(callback.resolve, callback.reject);
			return promise;
		}

		callback.promise	= promise;
		callback.resolve	= resolve;
		callback.reject		= reject;
		callback.next		= next;

		return callback;
	},
	timeEnd: function(flow, inited)
	{
		var timing = this.runtime.timing;
		var endTime = timing.lastFlowEnd = Date.now();
		timing['flowEnd_'+flow.name] = endTime;
		if (inited) timing.flowsEnd = endTime;
	}
};

