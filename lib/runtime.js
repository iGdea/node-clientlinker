"use strict";

var deprecate = require('depd')('clientlinker:linker');

exports.Runtime = Runtime;

function Runtime(client, methodKey, method,
	query, body, options)
{
	this.client = client;
	this.linker = client.linker;
	this.methodKey = methodKey;
	this.method = method;
	this.query = query;
	this.body = body;
	this.options = options;
	this.promise = null;
	this.navigationStart = Date.now();
	this.retry = [];
	this.timing = {};
}

var proto = Runtime.prototype;
proto.lastFlow = function()
{
	var retry = this.retry[this.retry.length-1];
	if (retry)
	{
		return retry.lastFlow();
	}
}

Object.defineProperty(proto, 'runOptions',
	{
		configurable: true,
		get: function() {return this.options},
		set: function(val) {this.options = val}
	});

deprecate.property(proto, 'runOptions', 'use `runtime.options` instead of `runtime.runOptions`');
