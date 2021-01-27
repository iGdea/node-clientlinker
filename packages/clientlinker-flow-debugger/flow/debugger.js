const debug = require('debug')('clientlinker-flow-debugger');

module.exports = debuggerFlow;

function debuggerFlow(runtime, callback) {
	const client = runtime.client;
	const options = client.options;

	return callback
		.next()
		.then(function(data) {
			if (options.debuggerRuntime) {
				debug('return runtime!!');
				runtime.originalReturn = data;
				return runtime;
			} else {
				if (data) data.__runtime__ = runtime;
				return data;
			}
		})
		.catch(function(err) {
			if (options.debuggerRuntime) {
				debug('return runtime!!');
				runtime.originalReturn = err;
				throw runtime;
			} else {
				if (err && typeof err == 'object') err.__runtime__ = runtime;
				throw err;
			}
		});
}
