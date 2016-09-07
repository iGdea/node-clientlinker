"use strict";

var _		= require('underscore');
var debug	= require('debug')('client_linker:httpproxy:route');
var aes		= require('../../lib/aes_cipher');
var rawBody	= require('raw-body');

exports = module.exports = HttpProxyRoute;

function HttpProxyRoute(linker)
{
	if (!linker) return function(req, res, next){next()};
	linker.__bind_httpproxy_route__ = true;

	return function HttpProxyRouteHandle(req, res, next)
	{
		var action = req.query.action;
		if (!action) return next();

		function sendStatus(res, code, env)
		{
			res.statusCode = code;
			res.json(linker.JSON.stringify(
				{
					env: env,
					CONST_VARS: linker.JSON.CONST_VARS
				}));
		}

		rawBody(req).then(function(buf)
			{
				var body = JSON.parse(buf.toString());
				if (body.CONST_VARS)
					body = linker.JSON.parse(body, body.CONST_VARS);

				return runAction(linker, action, body)
					.catch(function(err)
					{
						debug('[%s] linker run err:%o', action, err);
						return {
							statusCode: 500,
							env: body && body.env,
							result: err
						};
					})
					.then(function(data)
					{
						res.statusCode = data.statusCode;
						var output = {
							env: data.env,
							result: data.result,
							data: data.data
						};

						output.CONST_VARS = linker.JSON.CONST_VARS;
						output = linker.JSON.stringify(output);
						res.json(output);
					});
			})
			.catch(function()
			{
				debug('[%s] parse body err:%o', action, err);
				res.statusCode = 500;
				res.json({});
			});
	};
}


function runAction(linker, action, body)
{
	return linker.parseAction(action)
		.then(function(methodInfo)
		{
			var options = methodInfo.client && methodInfo.client.options;

			if (checkHttpproxyKey(action, body, options) ===  false)
				return {statusCode: 403};

			debug('[%s] catch proxy route', action);
			var args = [action, body.query, body.body, null, body.options];
			var retPromise = linker.runIn(args, 'httpproxy', body.env);

			return retPromise.then(function(data)
				{
					var runtime = retPromise.runtime;
					// console.log('svr env for data', runtime.env);
					return {
						statusCode: 200,
						env: runtime.env,
						data: data
					};
				})
				.catch(function(err)
				{
					var runtime = retPromise.runtime;
					var output = {
						env: runtime ? runtime.env : body.env,
						result: err
					};

					// console.log('svr env for err', env);
					if (err
						&& (err.CLIENTLINKER_TYPE == 'CLIENT FLOW OUT'
							|| err.CLIENTLINKER_TYPE == 'CLIENT NO FLOWS'
							|| err.CLIENTLINKER_TYPE == 'NO CLIENT'))
					{
						debug('[%s] %s', action, err);
						output.statusCode = 501;
					}
					else
					{
						output.statusCode = 200;
					}

					return output;
				});
		});
}


exports.checkHttpproxyKey = checkHttpproxyKey;
function checkHttpproxyKey(action, body, options)
{
	options || (options = {});
	var httpproxyKey = options.httpproxyKey;
	var httpproxyKeyRemain = options.httpproxyKeyRemain || 15*60*1000;

	debug('httpproxyKey: %s, remain:%sms', httpproxyKey, httpproxyKeyRemain);

	if (!httpproxyKey) return;
	if (!body.key)
	{
		debug('[%s] no httpproxy aes key', action);
		return false;
	}

	if (httpproxyKey == body.key)
	{
		debug('[%s] pass:use body key', action);
		return;
	}

	var realAction, remain;
	try {
		realAction = aes.decipher(body.key, httpproxyKey).split(',');
	}
	catch(err)
	{
		debug('[%s] can not decipher key:%s, err:%o', action, body.key, err);
		return false;
	}

	remain = Date.now() - realAction.pop();
	realAction = realAction.join(',');

	if (remain > httpproxyKeyRemain)
	{
		debug('[%s] key expired, remain:%sms', action, remain);
		return false;
	}

	if (realAction != action)
	{
		debug('[%s] inval aes key, aes:%s', action, realAction);
		return false;
	}
}
