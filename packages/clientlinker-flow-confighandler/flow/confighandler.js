'use strict';

var debug = require('debug')('clientlinker-flow-confighandler');
module.exports = function confighandler(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;
	if (!options.confighandler) return callback.next();

	var handler = options.confighandler[runtime.method];

	if (typeof handler == 'function')
	{
		if (typeof callback == 'object') callback = callback.toFuncCallback();
		return handler(runtime.query, runtime.body, callback, runtime.options);
	}
	else
	{
		debug('config no handler:%s', runtime.method);
		return callback.next();
	}
};
