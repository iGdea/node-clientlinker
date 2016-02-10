var debug = require('debug')('client_linker:logger');
exports = module.exports = logger;

function logger(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	if (!options.logger) return callback.next();
	var logger = typeof options.logger == 'function' ? options.logger : log;

	callback.next();
	runtime.promise.then(function(data)
		{
			logger(runtime.methodKey, runtime.query, runtime.body, null, data, runtime);
		},
		function(err)
		{
			logger(runtime.methodKey, runtime.query, runtime.body, err, null, runtime);
		});
}

function log(methodKey, query, body, err, data, runtime)
{
	var timing = runtime.timing;
	debug('task info <%s>, query:%o, body:%o, err:%o, data:%o, options:%o, use:%dms run:%dms', methodKey, query, body, err, data, runtime.runOptions, timing.flowsEnd - timing.navigationStart, timing.lastFlowEnd - timing.lastFlowStart);
}
