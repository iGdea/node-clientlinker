'use strict';

var _				= require('lodash');
var Promise			= require('bluebird');
var FlowsRuntime	= require('./flows_runtime').FlowsRuntime;
var Timing			= require('./timing/client_runtime_timing').Timing;
var utils			= require('../utils');

exports.ClientRuntime = ClientRuntime;

function ClientRuntime(linker, action, query, body, options)
{
	this.linker		= linker;
	this.action		= action;
	this.client		= null;
	this.method		= null;

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

	this.timing	= new Timing(this);
	this.navigationStart = Date.now();
}

var proto = ClientRuntime.prototype;
_.extend(proto,
{
	run: function()
	{
		var self = this;
		if (!self.client) throw utils.newNotFoundError('NO CLIENT', self);

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
		var onetry = new FlowsRuntime(this);
		this.lastTry = onetry;
		this.retry.push(onetry);
		return onetry.run();
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

	getLastRunner: function()
	{
		return this.lastTry && this.lastTry.lastRunner;
	},
	getFirstRunner: function()
	{
		var firstTry = this.retry[0];
		return firstTry && firstTry.runned[0];
	},
	isStarted: function()
	{
		var firstTry = this.retry[0];
		return firstTry && firstTry.started;
	},
	isFinished: function()
	{
		return this.lastTry && this.lastTry.finished;
	}
});

require('../deps/dep_client_runtime').proto(ClientRuntime);
