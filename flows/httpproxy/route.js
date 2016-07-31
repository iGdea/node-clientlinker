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
		bodyParser(req, res, function(err)
		{
			if (err)
			{
				if (!req.query.action) return next();
				return next(err);
			}

			var data = req.body;
			var methodKey = data.action || req.query.action;
			if (!methodKey) return next();
			if (data.action != req.query.action) debug('action not equal, query:%s, body:%s', req.query.action, body.action);

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
							next(new Error('no httpproxy key'));
							return;
						}

						if (httpproxyKey == data.key)
						{
							debug('pass:use data key');
						}
						else
						{
							var realMethodKey = aes.decipher(data.key, httpproxyKey).split(',');
							var remain = Date.now() - realMethodKey.pop();
							realMethodKey = realMethodKey.join(',');

							if (remain > httpproxyKeyRemain)
							{
								debug('key expired, remain:%sms', remain);
								next(new Error('key expired'));
								return;
							}

							if (realMethodKey != methodKey)
							{
								debug('inval aes key, query:%s, aes:%s', methodKey, realMethodKey);
								next(new Error('inval key'));
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
