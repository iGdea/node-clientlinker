"use strict";

var deprecate = require('depd')('clientlinker:runtime');

exports.Runtime = Runtime;

function Runtime(client, methodKey, method,
	query, body, options)
{
	this.client				= client;
	this.linker				= client.linker;
	this.methodKey			= methodKey;
	this.method				= method;
	this.query				= query;
	this.body				= body;
	this.options			= options;
	this.promise			= null;
	this.navigationStart	= Date.now();
	this.retry				= [];
	this.timing				= this.newTiming();
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

deprecate.property(proto, 'runOptions', 'use `runtime.options` instead of `runtime.runOptions`');



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
