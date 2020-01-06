'use strict';

var json = require('../lib/json');
var httpAction = require('./http_action');

exports = module.exports = HttpProxyRoute;
exports.express = routeExpress;
exports.koa = routeKoa;

function HttpProxyRoute(linker)
{
	return function HttpProxyRouteHandle(req, res, next)
	{
		var serverRouterTime = new Date();
		res.set('XH-Httpproxy-RequestTime', +serverRouterTime);

		if (arguments.length >= 3)
			return routeExpress(linker, serverRouterTime, req, res, next);
		else
			return routeKoa(linker, serverRouterTime, req, res);
	};
}

function routeKoa(linker, serverRouterTime, ctx, next)
{
	if (!linker) return next();

	return httpAction(linker, serverRouterTime, ctx.req)
		.then(function(output)
		{
			var res = ctx.response;
			res.statusCode = output.statusCode || 200;
			var data = output.data;
			if (data && typeof data == 'object')
			{
				data = json.stringify(data);
				data.CONST_KEY = json.CONST_KEY;
			}

			res.type = 'json';
			res.body = data;
			res.set('XH-Httpproxy-ResponseTime', Date.now());
		});
}


function routeExpress(linker, serverRouterTime, req, res, next)
{
	if (!linker) return next();

	return httpAction(linker, serverRouterTime, req)
		.then(function(output)
		{
			res.statusCode = output.statusCode || 200;
			var data = output.data;
			data = json.stringify(data);
			data.CONST_KEY = json.CONST_KEY;

			res.set('XH-Httpproxy-ResponseTime', Date.now());
			res.json(data);
		});
}
