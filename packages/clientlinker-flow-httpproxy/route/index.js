'use strict';

let httpAction = require('./http_action');
let reqUniqKey = require('./req_uniq_key');

exports = module.exports = HttpProxyRoute;
exports.express = routeExpress;
exports.koa = routeKoa;

function HttpProxyRoute(linker)
{
	return function HttpProxyRouteHandle(req, res, next)
	{
		let serverRouterTime = new Date();
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

	return cgihandler(linker, serverRouterTime, ctx.req)
		.then(function(output)
		{
			let res = ctx.response;
			res.statusCode = output.statusCode || 200;
			res.type = 'json';
			res.body = output.data;
			res.set('XH-Httpproxy-ResponseTime', Date.now());
		});
}


function routeExpress(linker, serverRouterTime, req, res, next)
{
	if (!linker) return next();

	return cgihandler(linker, serverRouterTime, req)
		.then(function(output)
		{
			res.statusCode = output.statusCode || 200;
			res.set('XH-Httpproxy-ResponseTime', Date.now());
			res.json(output.data);
		});
}

function cgihandler(linker, serverRouterTime, req)
{
	if (req.query.cgi == 'req_uniq_key') {
		return reqUniqKey(linker, req);
	} else {
		return httpAction(linker, serverRouterTime, req);
	}
}
