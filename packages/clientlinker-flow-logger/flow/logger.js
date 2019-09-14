'use strict';

var debug = require('debug')('clientlinker-flow-logger');
exports = module.exports = logger;

function logger(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	if (!options.logger) return callback.next();
	var logger = typeof options.logger == 'function' ? options.logger : loggerHandler;

	runtime.promise.then(function(data)
		{
			logger(runtime, null, data);
		},
		function(err)
		{
			logger(runtime, err || 'CLIENT_LINKER_DEFERT_ERROR', null);
		});

	return callback.next();
}


exports.loggerHandler = loggerHandler;
function loggerHandler(runtime, err, data)
{
	var timing = runtime.timing;
	var lastFlowTiming = runtime.lastFlow();
	lastFlowTiming = (lastFlowTiming && lastFlowTiming.timing) || {};

	if (err)
	{
		debug('client action err <%s> %d/%d/%dms retry:%d query:%o, body:%o, err:%o, data:%o, options:%o',
			runtime.action,
			lastFlowTiming.end - lastFlowTiming.start,		// flow执行时间
			timing.flowsEnd - runtime.navigationStart,		// 中共耗时
			lastFlowTiming.start - runtime.navigationStart,		// 路由+重试时间
			runtime.retry.length,
			runtime.query,
			runtime.body,
			err, data,
			runtime.options
		);
	}
	else
	{
		debug('client action <%s> %d/%d/%dms retry:%d query:%o, body:%o, data:%o, options:%o',
			runtime.action,
			lastFlowTiming.end - lastFlowTiming.start,
			timing.flowsEnd - runtime.navigationStart,
			lastFlowTiming.start - runtime.navigationStart,
			runtime.retry.length,
			runtime.query,
			runtime.body,
			data,
			runtime.options
		);
	}
}
