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
		runHandler(runtime, callback, handler);
	else
	{
		debug('config no handler:%s', runtime.method);
		callback.next();
	}
}

exports.runHandler = runHandler;
function runHandler(runtime, callback, handler)
{
	var ret = handler(runtime.query, runtime.body, callback, runtime.options);

	if (isPromise(ret))
		ret.then(callback.resolve, callback.reject);
}
