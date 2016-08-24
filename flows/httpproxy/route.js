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
		var methodKey = req.query.action;
		if (!methodKey) return next();

		bodyParser(req, res, function(err)
		{
			if (err)
			{
				debug('[%s] parse body err:%o', methodKey, err);
				res.sendStatus(500);
				return;
			}

			var body = req.body;

			linker.parseMethodKey(methodKey)
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
							debug('[%s] no httpproxy aes key', methodKey);
							res.sendStatus(403);
							return;
						}

						if (httpproxyKey == body.key)
						{
							debug('[%s] pass:use body key', methodKey);
						}
						else
						{
							var realMethodKey, remain;
							try {
								realMethodKey = aes.decipher(body.key, httpproxyKey)
													.split(',');
							}
							catch(err)
							{
								debug('[%s] can not decipher key:%s, err:%o',
									methodKey, body.key, err);
								res.sendStatus(403);
								return;
							}

							remain = Date.now() - realMethodKey.pop();
							realMethodKey = realMethodKey.join(',');

							if (remain > httpproxyKeyRemain)
							{
								debug('[%s] key expired, remain:%sms', methodKey, remain);
								res.sendStatus(403);
								return;
							}

							if (realMethodKey != methodKey)
							{
								debug('[%s] inval aes key, query:%s, aes:%s',
										methodKey, methodKey, realMethodKey);
								res.sendStatus(403);
								return;
							}
						}
					}

					if (body.CONST_VARS) body = linker.JSON.parse(body, body.CONST_VARS);

					debug('[%s] catch proxy route', methodKey);
					linker.newRuntime(methodKey, body.query, body.body, body.options)
						.then(function(runtime)
						{
							_.extend(runtime.data, body.data);

							return linker.runByRuntime(runtime, function(err, data)
							{
								debug('[%s] return err:%o data:%o', methodKey, err, data);

								if (err
									&& (err.CLIENTLINKER_TYPE == 'CLIENT FLOW OUT'
										|| err.CLIENTLINKER_TYPE == 'CLIENT NO FLOWS'
										|| err.CLIENTLINKER_TYPE == 'NO CLIENT'))
								{
									debug('[%s] %s', methodKey, err);
									res.sendStatus(501);
									return;
								}

								res.json(linker.JSON.stringify(
								{
									result		: err,
									data		: data,
									CONST_VARS	: linker.JSON.CONST_VARS
								}));
							});
						});

				})
				.catch(function(err)
				{
					debug('[%s] linker run err:%o', methodKey, err);
					res.sendStatus(500);
				});

		});
	};
}
