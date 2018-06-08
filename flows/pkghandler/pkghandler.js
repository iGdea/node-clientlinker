"use strict";

var debug	= require('debug')('clientlinker:pkghandler');

exports = module.exports = pkghandler;
exports.methods		= require('./methods');

function pkghandler(runtime, callback)
{
	var client = runtime.client;
	var mod = initClient(client);

	if (!mod) return callback.next();
	var handler = mod[runtime.method];

	if (handler)
	{
		return handler(runtime.query, runtime.body, callback, runtime.options);
	}
	else
	{
		debug('pkg no handler:%s', runtime.method);
		return callback.next();
	}
}


exports.initClient = initClient;
function initClient(client)
{
	var options		= client.options;
	// var linker		= client.linker;
	// var retryTimes	= linker.pkghandlerRetryTimes || (linker.pkghandlerRetryTimes = {});
	if (!options.pkghandler) return;

	if (!client.pkghandlerModuleLoaded)
	{
		client.pkghandlerModule = require(options.pkghandler);
		client.pkghandlerModuleLoaded = true;
	}

	return client.pkghandlerModule;
}
