var debug = require('debug')('client_linker:confighandler');

exports = module.exports = confighandler;

function confighandler(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;
	if (!options.confighandler || !runtime.methodName in options.confighandler) return callback.next();

	var handler = options.confighandler[runtime.methodName];

	if (typeof handler == 'function')
		runHandler(runtime, callback, handler);
	else
		callback(null, handler);
}

exports.methods = methods;
function methods(client)
{
	var options = client.options;
	if (typeof options.confighandler == 'object')
	{
		return Object.keys(options.confighandler);
	}
}

exports.runHandler = runHandler;
function runHandler(runtime, callback, handler)
{
	var ret = handler(runtime.query, runtime.body, callback, runtime.runOptions);

	if (ret instanceof Promise)
	{
		ret.then(callback.resolve, callback.reject);
	}
}
