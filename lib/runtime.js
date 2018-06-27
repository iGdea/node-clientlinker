'use strict';

var deprecate = require('depd')('clientlinker:runtime');

exports.Runtime = Runtime;

function Runtime(client, action, method,
	query, body, options)
{
	this.client				= client;
	this.linker				= client.linker;
	this.action				= action;
	this.method				= method;
	// 如果使用httpproxy，必须是可以被序列化的
	this.query				= query;
	// 如果使用httpproxy，必须是可以被序列化的
	this.body				= body;
	// 如果使用httpproxy，必须是可以被序列化的
	this.options			= options;
	this.promise			= null;
	this.navigationStart	= Date.now();
	this.retry				= [];
	this.timing				= this.newTiming();
	// 保存框架运行过程中的数据
	// 比如httproxy运行次数
	// 如果使用httpproxy，必须是可以被序列化的
	this.env				= {};
}

var proto = Runtime.prototype;
proto.lastFlow = function()
{
	var retry = this.retry[this.retry.length-1];
	if (retry)
	{
		return retry.lastFlow();
	}
};

proto.newTiming = function()
{
	return new Timing(this);
};

Object.defineProperty(proto, 'runOptions',
	{
		configurable: true,
		get: function() {return this.options},
		set: function(val) {this.options = val}
	});

deprecate.property(proto, 'runOptions',
	'use `runtime.options` instead of `runtime.runOptions`');



Object.defineProperty(proto, 'methodKey',
	{
		configurable: true,
		get: function() {return this.action},
		set: function(val) {this.action = val}
	});

deprecate.property(proto,
	'methodKey', 'use `runtime.action` instead of `runtime.methodKey`');



function Timing(runtime)
{
	this.runtime = runtime;
}

var proto = Timing.prototype;

Object.defineProperty(proto, 'navigationStart',
	{
		configurable: true,
		get: function() {return this.runtime.navigationStart},
		set: function() {}
	});

deprecate.property(proto, 'navigationStart', 'use `runtime.navigationStart` instead of `runtime.timing.navigationStart`');
