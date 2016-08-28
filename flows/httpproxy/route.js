"use strict";

var _		= require('underscore');
var debug	= require('debug')('client_linker:httpproxy:route');
var aes		= require('../../lib/aes_cipher');
var defaultBodyParser	= require('body-parser').json({limit: '200mb'});

exports = module.exports = HttpProxyRoute;

function HttpProxyRoute(linker, bodyParser)
{
	if (!linker) return function(req, res, next){next()};
	bodyParser || (bodyParser = defaultBodyParser);

	linker.__bind_httpproxy_route__ = true;

	function sendStatus(res, code, env)
	{
		res.statusCode = code;
		res.json(linker.JSON.stringify(
			{
				env: env,
				CONST_VARS: linker.JSON.CONST_VARS
			}));
	}

	return function HttpProxyRouteHandle(req, res, next)
	{
		var action = req.query.action;
		if (!action) return next();

		bodyParser(req, res, function(err)
		{
			var body = req.body;
			if (err)
			{
				debug('[%s] parse body err:%o', action, err);
				return sendStatus(res, 500, body && body.env);
			}

			linker.parseAction(action)
				.then(function(methodInfo)
				{
					if (body.CONST_VARS)
						body = linker.JSON.parse(body, body.CONST_VARS);

					var options = methodInfo.client && methodInfo.client.options;

					if (checkHttpproxyKey(action, body, options) ===  false)
						return sendStatus(res, 403, body.env);

					debug('[%s] catch proxy route', action);
					var args = [action, body.query, body.body, null, body.options];
					var retPromise = linker.runIn(args, 'httpproxy', body.env);
					retPromise.then(function(data)
						{
							var runtime = retPromise.runtime;
							var json = linker.JSON.stringify(
								{
									env: runtime.env,
									data: data,
									CONST_VARS: linker.JSON.CONST_VARS
								});

							res.json(json);
						})
						.catch(function(err)
						{
							var runtime = retPromise.runtime;
							var env = runtime ? runtime.env : body.env;
							if (err
								&& (err.CLIENTLINKER_TYPE == 'CLIENT FLOW OUT'
									|| err.CLIENTLINKER_TYPE == 'CLIENT NO FLOWS'
									|| err.CLIENTLINKER_TYPE == 'NO CLIENT'))
							{
								debug('[%s] %s', action, err);
								return sendStatus(res, 501, env);
							}
							else
							{
								var json = linker.JSON.stringify(
									{
										env: env,
										result: err,
										CONST_VARS: linker.JSON.CONST_VARS
									});

								res.json(json);
							}
						});
				})
				.catch(function(err)
				{
					debug('[%s] linker run err:%o', action, err);
					sendStatus(res, 500, body && body.env);
				});

		});
	};
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
