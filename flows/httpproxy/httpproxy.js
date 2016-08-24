"use strict";

var debug	= require('debug')('client_linker:httpproxy');
var request	= require('request');
var aes		= require('../../lib/aes_cipher');

exports = module.exports = httpproxy;

function httpproxy(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;
	var linker = client.linker;
	var runData = runtime.data;
	if (!options.httpproxy) return callback.next();

	if (linker.__bind_httpproxy_route__ && options.httpproxyNotRunWhenBindRoute !== false)
	{
		debug('[%s] not request httpproxy when bind route', runtime.methodKey);
		return callback.next();
	}

	var httpproxyLevel = options.httpproxyLevel;
	var nextHttpproxyLevel = runData.httpproxyLevel || 0;
	nextHttpproxyLevel++;
	if ((!httpproxyLevel && httpproxyLevel !== 0)
		|| httpproxyLevel < 0)
	{
		httpproxyLevel = 1;
	}
	if (nextHttpproxyLevel > httpproxyLevel)
	{
		debug('[%s] not request httpproxy, level overflow:%d >= %d',
			runtime.methodKey, nextHttpproxyLevel, httpproxyLevel);
		return callback.next();
	}

	runData.httpproxyLevel = nextHttpproxyLevel;


	var body = {
		query		: runtime.query,
		body		: runtime.body,
		options	    : runtime.options,
		data		: runtime.data,
		CONST_VARS	: linker.JSON.CONST_VARS,
	};
	// check aes key
	if (options.httpproxyKey) body.key = aes.cipher(runtime.methodKey+','+Date.now(), options.httpproxyKey);

	var headers = options.httpproxyHeaders || {};
	headers['Content-Type'] = 'application/json';

	var runOptions	= runtime.options || {};
	var timeout		= runOptions.timeout || options.httpproxyTimeout || 10000;
	var proxy		= runOptions.httpproxyProxy
			|| options.httpproxyProxy
			|| process.env.clientlinker_http_proxy
			|| process.env.http_proxy;

	var url = appendUrl(options.httpproxy, 'action='+runtime.methodKey);
	debug('request url:%s', url);

	request.post(
	{
		url		: url,
		body	: JSON.stringify(linker.JSON.stringify(body), null, '\t'),
		headers	: headers,
		timeout	: timeout,
		proxy	: proxy
	},
	function(err, respone, body)
	{
		if (!err && respone.statusCode != 200)
		{
			if (respone.statusCode == 501)
			{
				debug('[%s] respone 501, go next flow', runtime.methodKey);
				return callback.next();
			}
			else
				err = 'respone!200,'+respone.statusCode;
		}

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

		if (data.CONST_VARS) data = linker.JSON.parse(data, data.CONST_VARS);

		if (data.result)
			callback(data.result);
		else
			callback(null, data.data);
	});
}


function appendUrl(url, query)
{
	var lastChar = url.charAt(url.length-1);
	var splitChar = lastChar == '?' || lastChar == '&'
			? '' : (url.indexOf('?') != -1 ? '&' : '?');

	return url + splitChar + query;
}
