"use strict";

exports = module.exports = debug;

function debug(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	callback.next(true)
		.then(function(data)
		{
			if (data) data.__runtime__ = runtime;
			callback.resolve(data);
		})
		.catch(function(err)
		{
			if (err) err.__runtime__ = runtime;
			callback.reject(err);
		});
}
