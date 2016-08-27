"use strict";

var _		= require('underscore');
var debug	= require('debug')('client_linker:httpproxy:route');
var aes		= require('../../lib/aes_cipher');
var defaultBodyParser	= require('body-parser').json({limit: '200mb'});

module.exports = HttpProxyRoute;

function HttpProxyRoute(linker, bodyParser)
{
	if (!linker) return function(req, res, next){next()};
	bodyParser || (bodyParser = defaultBodyParser);


	linker.__bind_httpproxy_route__ = true;

	return function HttpProxyRouteHandle(req, res, next)
	{
		var action = req.query.action;
		if (!action) return next();

		bodyParser(req, res, function(err)
		{
			if (err)
			{
				debug('[%s] parse body err:%o', action, err);
				res.sendStatus(500);
				return;
			}

			var body = req.body;

			linker.parseAction(action)
				.then(function(methodInfo)
				{
					var httpproxyKey = methodInfo.client
							&& methodInfo.client.options.httpproxyKey;
					var httpproxyKeyRemain = (methodInfo.client
							&& methodInfo.client.options.httpproxyKeyRemain)
							|| 15*60*1000;

					debug('httpproxyKey: %s, remain:%sms', httpproxyKey,
							httpproxyKeyRemain);

					if (httpproxyKey)
					{
						if (!body.key)
						{
							debug('[%s] no httpproxy aes key', action);
							res.sendStatus(403);
							return;
						}

						if (httpproxyKey == body.key)
						{
							debug('[%s] pass:use body key', action);
						}
						else
						{
							var realAction, remain;
							try {
								realAction = aes.decipher(body.key, httpproxyKey)
													.split(',');
							}
							catch(err)
							{
								debug('[%s] can not decipher key:%s, err:%o',
									action, body.key, err);
								res.sendStatus(403);
								return;
							}

							remain = Date.now() - realAction.pop();
							realAction = realAction.join(',');

							if (remain > httpproxyKeyRemain)
							{
								debug('[%s] key expired, remain:%sms', action, remain);
								res.sendStatus(403);
								return;
							}

							if (realAction != action)
							{
								debug('[%s] inval aes key, query:%s, aes:%s',
										action, action, realAction);
								res.sendStatus(403);
								return;
							}
						}
					}

					if (body.CONST_VARS) body = linker.JSON.parse(body, body.CONST_VARS);

					debug('[%s] catch proxy route', action);
					var args = [action, body.query, body.body, null, body.options];
					linker.runIn(args, 'httpproxy', body.env)
						.then(function(data)
						{
							var json = linker.JSON.stringify(
								{
									data: data,
									CONST_VARS: linker.JSON.CONST_VARS
								});

							res.json(json);
						})
						.catch(function(err)
						{
							if (err
								&& (err.CLIENTLINKER_TYPE == 'CLIENT FLOW OUT'
									|| err.CLIENTLINKER_TYPE == 'CLIENT NO FLOWS'
									|| err.CLIENTLINKER_TYPE == 'NO CLIENT'))
							{
								debug('[%s] %s', action, err);
								res.sendStatus(501);
							}
							else
							{
								var json = linker.JSON.stringify(
									{
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
					res.sendStatus(500);
				});

		});
	};
}
