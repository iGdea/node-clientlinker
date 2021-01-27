const debug = require('debug')('clientlinker-flow-logger');
exports = module.exports = logger;

function logger(runtime, callback) {
	const client = runtime.client;
	const options = client.options;

	if (!options.logger) return callback.next();
	const logger = typeof options.logger == 'function' ? options.logger : loggerHandler;
	const promise = callback.next();

	promise.then(function(data) {
		logger(runtime, null, data);
	}, function(err) {
		logger(runtime, err || 'CLIENT_LINKER_DEFERT_ERROR', null);
	});

	return promise;
}

exports.loggerHandler = loggerHandler;
function loggerHandler(runtime, err, data) {
	if (err) {
		debug(
			'client action err <%s> retry:%d query:%o, body:%o, err:%o, data:%o, options:%o',
			runtime.action,
			runtime.retry.length,
			runtime.query,
			runtime.body,
			err,
			data,
			runtime.options
		);
	} else {
		debug(
			'client action <%s> retry:%d query:%o, body:%o, data:%o, options:%o',
			runtime.action,
			runtime.retry.length,
			runtime.query,
			runtime.body,
			data,
			runtime.options
		);
	}
}
