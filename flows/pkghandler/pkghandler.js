var debug = require('debug')('client_linker:pkghandler');
var runHandler = require('../confighandler/confighandler').runHandler;

exports = module.exports = pkghandler;

function pkghandler(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	if (!options.pkghandler) return callback.next();

	if (!client.pkghandlerModule)
	{
		try {
			client.pkghandlerModule = require(options.pkghandler);
		}
		catch(e)
		{
			debug('load pkg err:%o', e);
			return callback.next();
		}
	}

	if (!client.pkghandlerModule) return callback.next();
	var handler = client.pkghandlerModule[runtime.methodName];
	if (!handler)
	{
		debug('no handler:%s', runtime.methodName);
		return callback.next();
	}
	else
	{
		runHandler(runtime, callback, handler);
	}
}

exports.initConfig = require('./initConfig');
