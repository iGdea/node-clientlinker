var debug = require('debug')('client_linker:logger');
var DEFAULT_ERRMSG = require('../../lib/main').DEFAULT_ERRMSG;
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
			logger(runtime, null, data);
		},
		function(err)
		{
			logger(runtime, err || DEFAULT_ERRMSG, null);
		});
}

function log(runtime, err, data)
{
	var timing = runtime.timing;
	debug('task info <%s> query:%o, body:%o, err:%o, data:%o, options:%o, use:%dms run:%dms',
		runtime.methodKey,
		runtime.query,
		runtime.body,
		err, data,
		runtime.runOptions,
		timing.flowsEnd - timing.navigationStart,
		timing.lastFlowEnd - timing.lastFlowStart);
}
