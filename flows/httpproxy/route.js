"use strict";

var debug	= require('debug')('client_linker:httpproxy:route');
var aes		= require('../../lib/aes_cipher');
var defaultBodyParser	= require('body-parser').json({limit: '200mb'});

module.exports = HttpProxyRoute;

function HttpProxyRoute(linker, bodyParser)
{
	if (!linker) return function(req, res, next){next()};
	bodyParser || (bodyParser = defaultBodyParser);

	return function(req, res, next)
	{
		var methodKey = req.query.action;
		if (!methodKey) return next();

		bodyParser(req, res, function(err)
		{
			if (err) return next(err);

			var data = req.body;

			linker.parseMethodKey(methodKey)
				.then(function(methodInfo)
				{
					var httpproxyKey = methodInfo.client && methodInfo.client.options.httpproxyKey;
					var httpproxyKeyRemain = (methodInfo.client && methodInfo.client.options.httpproxyKeyRemain || 15*60*1000);

					debug('httpproxyKey: %s, remain:%sms', httpproxyKey, httpproxyKeyRemain);

					if (httpproxyKey)
					{
						if (!data.key)
						{
							debug('no httpproxy aes key');
							res.sendStatus(403);
							return;
						}

						if (httpproxyKey == data.key)
						{
							debug('pass:use data key');
						}
						else
						{
							var realMethodKey, remain;
							try {
								realMethodKey = aes.decipher(data.key, httpproxyKey).split(',');
							}
							catch(err)
							{
								debug('can not decipher key:%s, err:%o', data.key, err);
								res.sendStatus(403);
								return;
							}

							remain = Date.now() - realMethodKey.pop();
							realMethodKey = realMethodKey.join(',');

							if (remain > httpproxyKeyRemain)
							{
								debug('key expired, remain:%sms', remain);
								res.sendStatus(403);
								return;
							}

							if (realMethodKey != methodKey)
							{
								debug('inval aes key, query:%s, aes:%s', methodKey, realMethodKey);
								res.sendStatus(403);
								return;
							}
						}
					}

					if (data.CONST_VARS) data = linker.JSON.parse(data, data.CONST_VARS);

					debug('catch proxy route:%s', methodKey);
					linker.run(methodKey, data.query, data.body, function(err, data)
						{
							if (typeof err == 'string'
								&& err.substr(0,13) == 'CLIENTLINKER:')
							{
								return next();
							}

							res.json(linker.JSON.stringify(
							{
								result		: err,
								data		: data,
								CONST_VARS	: linker.JSON.CONST_VARS
							}));
						},
						data.options);
				})
				.catch(function(err)
				{
					debug('linker run err:%o', err);
					next(err);
				});

		});
	};
}
