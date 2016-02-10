var debug				= require('debug')('client_linker:httpproxy:route');
var json				= require('../../lib/json');
var defaultBodyParser	= require('body-parser').json({limit: '200mb'});

module.exports = HttpProxyRoute;

function HttpProxyRoute(linker, bodyParser)
{
	if (!linker) return function(req, res, next){next()};
	bodyParser || (bodyParser = defaultBodyParser);

	return function(req, res, next)
	{
		if (!req.query.action) return next();

		bodyParser(req, res, function(err)
		{
			if (err) return next(err);

			var data = req.body;
			var methodKey = req.query.action;
			if (data.CONST_VARS) data = json.parse(data, data.CONST_VARS);

			debug('catch proxy route:%s', methodKey);
			linker.run(methodKey, data.query, data.body, function(err, data)
				{
					if (typeof err == 'string'
						&& err.substr(0,13) == 'CLIENTLINKER:')
					{
						return next();
					}

					res.json(json.stringify(
					{
						result		: err,
						data		: data,
						CONST_VARS	: json.CONST_VARS
					}));
				},
				data.runOptions);
		});
	};
}

