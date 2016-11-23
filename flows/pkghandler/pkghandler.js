"use strict";

var debug		= require('debug')('clientlinker:pkghandler');

exports = module.exports = pkghandler;
exports.initConfig	= require('./initConfig');
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
	var linker		= client.linker;
	var retryTimes	= linker.pkghandlerRetryTimes || (linker.pkghandlerRetryTimes = {});
	if (!options.pkghandler) return;

	if (!client.pkghandlerModule
		&& (options.debug || !retryTimes[client.name]))
	{
		try {
			client.pkghandlerModule = require(options.pkghandler);
		}
		catch(e)
		{
			if (retryTimes[client.name])
				retryTimes[client.name]++;
			else
				retryTimes[client.name] = 1;

			debug('load pkg err:%o', e);
		}
	}

	return client.pkghandlerModule;
}
