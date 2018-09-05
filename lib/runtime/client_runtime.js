'use strict';

var _				= require('lodash');
var Promise			= require('bluebird');
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

	// 执行过程中额外生成的一些数据
	this._debugData	= {};

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

		// 需要先给self赋值，在运行run
		// 避免flow运行的时候，self.promise = null
		// 例如：clientlinker-flow-logger
		self.promise = new Promise(function(resolve, reject)
		{
			process.nextTick(function()
			{
				self.promise = mainPromise;
				mainPromise.then(resolve, reject);
			});
		});

		self.promise.catch(_.noop);

		var mainPromise = self._run()
			.catch(function(err)
			{
				if (self.retry.length < retry)
					return self._run();
				else
					throw err;
			});

		return mainPromise;
	},
	_run: function()
	{
		var flowsRun = new FlowsRuntime(this);
		this.lastTry = flowsRun;
		this.retry.push(flowsRun);
		return flowsRun.run();
	},
	debug: function(key, val)
	{
		var data = this._debugData;
		switch(arguments.length)
		{
			case 0:
				return data;

			case 1:
				var arr = data[key];
				return arr && arr[arr.length-1].value;

			case 2:
			default:
				var arr = data[key] || (data[key] = []);
				arr.push(
				{
					retry: this.retry.length,
					value: val,
					runner: this.lastRunner
				});
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
	lastRunner:
	{
		get: function() {return this.lastTry && this.lastTry.lastRunner}
	}
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
	lastFlow:
	{
		configurable: true,
		get: function() {return this.lastRunner}
	}
});

deprecate.property(proto, 'runOptions',
	'use `runtime.options` instead of `runtime.runOptions`');
deprecate.property(proto,
	'methodKey', 'use `runtime.action` instead of `runtime.methodKey`');
deprecate.property(proto,
	'lastFlow', 'use `runtime.lastRunner` instead of `runtime.lastFlow`');
