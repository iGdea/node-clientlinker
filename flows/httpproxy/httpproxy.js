var debug	= require('debug')('client_linker:httpproxy');
var json	= require('../../lib/json');
var request	= require('request');

exports = module.exports = httpproxy;

function httpproxy(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;
	if (!options.httpproxy) return callback.next();

	var url = options.httpproxy+'action='+runtime.methodKey;
	var body = {
		action		: runtime.methodKey,
		query		: runtime.query,
		body		: runtime.body,
		CONST_VARS	: json.CONST_VARS,
		runOptions	: runtime.runOptions
	};
	var headers = options.httpproxyHeaders || {};
	headers['Content-Type'] = 'application/json';

	var runOptions	= runtime.runOptions || {};
	var timeout		= runOptions.timeout || options.httpproxyTimeout || 10000;
	var proxy		= runOptions.httpproxyProxy || options.httpproxyProxy || process.env.clientlinker_http_proxy || process.env.http_proxy;

	debug('request url:%s', url);

	request.post(
	{
		url		: url,
		body	: JSON.stringify(json.stringify(body)),
		headers	: headers,
		timeout	: timeout,
		proxy	: proxy
	},
	function(err, respone, body)
	{
		if (!err && respone.statusCode != 200) err = 'respone!200,'+respone.statusCode;

		if (err)
		{
			debug('request err:%o', err);
			// proxy请求出错，自动转到下一个中间件
			return options.httpproxyErrorNext ? callback.next() : callback(err);
		}

		var data;
		try {
			data = JSON.parse(body);
		}
		catch(e)
		{
			return options.httpproxyErrorNext ? callback.next() : callback(e);
		}

		if (data.CONST_VARS) data = json.parse(data, data.CONST_VARS);

		if (data.result)
			callback(data.result);
		else
			callback(null, data.data);
	});
}

