'use strict';

var debug = require('debug')('clientlinker-flow-debugger');

module.exports = debuggerFlow;

function debuggerFlow(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	return callback.next()
		.then(function(data)
		{
			if (options.debuggerRuntime)
			{
				debug('return runtime!!');
				runtime.originalReturn = data;
				callback.resolve(runtime);
			}
			else
			{
				if (data) data.__runtime__ = runtime;
				callback.resolve(data);
			}
		})
		.catch(function(err)
		{
			if (options.debuggerRuntime)
			{
				debug('return runtime!!');
				runtime.originalReturn = err;
				callback.reject(runtime);
			}
			else
			{
				if (err && typeof err == 'object') err.__runtime__ = runtime;
				callback.reject(err);
			}
		});
}
