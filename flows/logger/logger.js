var debug = require('debug')('client_linker:logger');
var DEFAULT_ERRMSG = require('../../lib/linker').DEFAULT_ERRMSG;
exports = module.exports = logger;

function logger(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	if (!options.logger) return callback.next();
	var logger = typeof options.logger == 'function' ? options.logger : loggerHandler;

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

function loggerHandler(runtime, err, data)
{
	var timing = runtime.timing;
	debug('client action <%s> %d/%dms query:%o, body:%o, err:%o, data:%o, options:%o',
		runtime.methodKey,
		timing.lastFlowEnd - timing.lastFlowStart,
		timing.flowsEnd - timing.navigationStart,
		runtime.query,
		runtime.body,
		err, data,
		runtime.runOptions
	);
}
