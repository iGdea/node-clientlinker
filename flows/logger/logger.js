var debug = require('debug')('client_linker:logger');
exports = module.exports = logger;

function logger(args, callback)
{
	var client = args.client;
	var options = client.options;

	if (!options.logger) return callback.next();
	var logger = typeof options.logger == 'function' ? options.logger : log;

	callback.next().then(function(data)
		{
			setTimeout(function()
			{
				logger(args.methodKey, args.query, args.body, null, data, args);
			},10);
		},
		function(err)
		{
			setTimeout(function()
			{
				logger(args.methodKey, args.query, args.body, err, null, args);
			},10);
		});
}

function log(methodKey, query, body, err, data, args)
{
	var timing = args.timing;
	debug('task info <%s>, query:%o, body:%o, err:%o, data:%o, options:%o, use:%dms run:%dms', methodKey, query, body, err, data, args.runOptions, timing.flowsEnd - timing.navigationStart, timing.lastFlowEnd - timing.lastFlowStart);
}
