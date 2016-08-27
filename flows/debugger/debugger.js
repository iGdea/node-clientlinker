"use strict";

exports = module.exports = {handler: debug, name: 'debugger'};

function debug(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	callback.next(true)
		.then(function(data)
		{
			if (options.debuggerRuntime)
			{
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
				runtime.originalReturn = err;
				callback.reject(runtime);
			}
			else
			{
				if (err) err.__runtime__ = runtime;
				callback.reject(err);
			}
		});
}
