"use strict";

var debug		= require('debug')('clientlinker:confighandler');
var isPromise	= require('is-promise');

exports = module.exports = confighandler;
exports.methods = require('./methods');

function confighandler(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;
	if (!options.confighandler) return callback.next();

	var handler = options.confighandler[runtime.method];

	if (typeof handler == 'function')
	{
		return handler(runtime.query, runtime.body, callback, runtime.options);
	}
	else
	{
		debug('config no handler:%s', runtime.method);
		return callback.next();
	}
}
