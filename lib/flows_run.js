"use strict";

var Promise		= require('bluebird');
var debug		= require('debug')('client_linker:flow_run');
var isPromise	= require('is-promise');
var Flow		= require('./flow').Flow;

exports.FlowsRun = FlowsRun;
function FlowsRun(runtime)
{
	this.runtime = runtime;
	this.runnedFlows = [];
}

FlowsRun.prototype = {
	run: function()
	{
		var runtime = this.runtime;
		var callback = this.callbackDefer_();
		var timing = runtime.timing = this.timing = runtime.newTiming();
		timing.flowsStart = Date.now();

		this.promise = runtime.promise = callback.promise
			= callback.promise.then(function(data)
				{
					timeEnd();
					return data;
				},
				function(err)
				{
					timeEnd();
					throw err;
				});

		function timeEnd()
		{
			timing.flowsEnd = Date.now();
		}

		return this.run_(callback);
	},

	lastFlow: function()
	{
		var list = this.runnedFlows;
		var index = list.length;
		while(index--)
		{
			if (list[index]) return list[index];
		}
	},

	run_: function(callback)
	{
		var self = this;
		var runtime = self.runtime;
		var client = runtime.client;
		var clientFlows = client.options.flows;
		var flow = self.next_(callback);

		if (!flow)
		{
			var err = new Error('CLIENTLINKER:CLIENT FLOW OUT,'
				+runtime.action
				+',len'+clientFlows.length);

			err.CLIENTLINKER_TYPE = 'CLIENT FLOW OUT';
			err.CLIENTLINKER_METHODKEY = runtime.action;
			err.CLIENTLINKER_CLIENT = client.name;

			callback.reject(err);

			return callback.promise;
		}

		callback.timing.start = Date.now();

		debug('run %s.%s flow:%s(%d/%d)',
			client.name,
			runtime.method,
			flow.name,
			self.runnedFlows.length,
			clientFlows.length);

		try {
			var ret = flow.handler.call(self, runtime, callback);
			if (isPromise(ret)) ret.catch(callback.reject);
		}
		catch(err)
		{
			callback.reject(err);
		}

		return callback.promise;
	},

	next_: function(callback)
	{
		var flow;
		var client = this.runtime.client;

		for(var linkerFlows = client.linker.flows,
			clientFlows = client.options.flows,
			index = this.runnedFlows.length;
			flow = clientFlows[index];
			index++)
		{
			var type = typeof flow;
			if (type == 'string')
			{
				flow = linkerFlows[flow];
				if (flow) break;
			}

			if (type == 'function')
			{
				flow = new Flow(flow.name, flow);
				break;
			}
			else
				this.runnedFlows.push(null);
		}

		this.runnedFlows.push(callback);
		callback.flow = flow;

		return flow;
	},
	// 注意：要保持当前的状态
	// 中间有异步的逻辑，可能导致状态改变
	callbackDefer_: function()
	{
		var self	= this;
		var client	= self.runtime.client;

		var resolve, reject;
		var promise = new Promise(function(resolve0, reject0)
			{
				resolve = resolve0;
				reject = reject0;
			})
			.then(function(data)
			{
				timeEnd();
				return data;
			},
			function(err)
			{
				timeEnd();

				// 将错误信息转化为Error对象
				if (client.options.anyToError)
					err = client.linker.anyToError(err, self.runtime);

				// 方便定位问题
				if (err && client.options.exportErrorInfo
					&& typeof err == 'object')
				{
					err.fromClient = client.name;
					err.fromClientMethod = self.runtime.method;
					if (callback.flow) err.fromClientFlow = callback.flow.name;
				}

				throw err;
			});

		function callback(ret, data)
		{
			ret ? callback.reject(ret) : callback.resolve(data);
		}

		function next(async)
		{
			var promise = self.run_(self.callbackDefer_());
			if (!async) promise.then(callback.resolve, callback.reject);
			return promise;
		}

		function timeEnd()
		{
			callback.timing.end = Date.now();
		}

		callback.promise	= promise;
		callback.resolve	= resolve;
		callback.reject		= reject;
		callback.next		= next;
		callback.timing		= {};

		return callback;
	}
};
