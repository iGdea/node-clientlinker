'use strict';

var _				= require('lodash');
var deprecate		= require('depd')('clientlinker:client_runtime');
var FlowsRuntime	= require('./flows_runtime').FlowsRuntime;

exports.ClientRuntime = ClientRuntime;

function ClientRuntime(client, action, method, query, body, options)
{
	this.client		= client;
	this.linker		= client.linker;
	this.action		= action;
	this.method		= method;
	// 如果使用httpproxy，必须是可以被序列化的
	this.query		= query;
	// 如果使用httpproxy，必须是可以被序列化的
	this.body		= body;
	// 如果使用httpproxy，必须是可以被序列化的
	this.options	= options;
	// 保存框架运行过程中的数据
	// 比如httproxy运行次数
	// 如果使用httpproxy，必须是可以被序列化的
	this.env		= {};

	// 运行中的状态
	this.retry		= [];
	this.lastTry	= null;
	this.promise	= null;
}

var proto = ClientRuntime.prototype;
_.extend(proto,
{
	run: function()
	{
		var self = this;
		var retry;
		if (self.options && self.options.retry)
			retry = self.options.retry;
		else
			retry = self.client.options.retry;

		var promise = self._run()
			.catch(function(err)
			{
				if (self.retry.length < retry)
					return self._run();
				else
					throw err;
			});
		self.promise = promise;

		return promise;
	},
	_run: function()
	{
		var flowsRun = new FlowsRuntime(this);
		this.lastTry = flowsRun;
		this.retry.push(flowsRun);
		return flowsRun.run();
	},
	nextFlow: function()
	{
		var retry = this.retry[this.retry.length-1];
		if (retry)
		{
			return retry.nextFlow();
		}
	},
});


Object.defineProperties(proto,
{
	started:
	{
		get: function()
		{
			var firstTry = this.retry[0];
			return firstTry && firstTry.started;
		}
	},
	finished:
	{
		get: function()
		{
			return this.lastTry && this.lastTry.finished;
		},
	},
	navigationStart:
	{
		get: function()
		{
			var firstTry = this.retry[0];
			return firstTry && firstTry.flowsStart;
		}
	},
	timing:
	{
		get: function()
		{
			var lastRunner = this.lastTry && this.lastTry.lastRunner
			return lastRunner && lastRunner.timing;
		},
	},
});



Object.defineProperties(proto,
{
	runOptions:
	{
		configurable: true,
		get: function() {return this.options},
		set: function(val) {this.options = val}
	},
	methodKey:
	{
		configurable: true,
		get: function() {return this.action},
		set: function(val) {this.action = val}
	},
});

deprecate.property(proto, 'runOptions',
	'use `runtime.options` instead of `runtime.runOptions`');
deprecate.property(proto,
	'methodKey', 'use `runtime.action` instead of `runtime.methodKey`');
