var debug		= require('debug')('client_linker:pkghandler');
var runHandler	= require('../confighandler/confighandler').runHandler;

exports = module.exports = pkghandler;
exports.initConfig	= require('./initConfig');
exports.methods		= require('./methods');

function pkghandler(runtime, callback)
{
	var client = runtime.client;
	var mod = initClient(client);

	if (!mod) return callback.next();
	var handler = mod[runtime.methodName];

	if (handler)
		runHandler(runtime, callback, handler);
	else
	{
		debug('pkg no handler:%s', runtime.methodName);
		callback.next();
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
