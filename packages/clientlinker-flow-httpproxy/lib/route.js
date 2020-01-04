'use strict';

var Promise		= require('bluebird');
var _			= require('lodash');
var debug		= require('debug')('clientlinker-flow-httpproxy:route');
var rawBody		= Promise.promisify(require('raw-body'));
var signature	= require('../lib/signature');
var json		= require('./json');
var LRUCache	= require('lru-cache');

exports = module.exports = HttpProxyRoute;
exports.express = routeExpress;
exports.koa = routeKoa;

function HttpProxyRoute(linker)
{
	return function HttpProxyRouteHandle(req, res, next)
	{
		var serverRouterTime = new Date();
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

	return httpAction(linker, serverRouterTime, ctx.req)
		.then(function(output)
		{
			var res = ctx.response;
			res.statusCode = output.statusCode || 200;
			var data = output.data;
			if (data && typeof data == 'object')
			{
				data = json.stringify(data);
				data.CONST_KEY = json.CONST_KEY;
			}

			res.type = 'json';
			res.body = data;
			res.set('XH-Httpproxy-ResponseTime', Date.now());
		});
}


function routeExpress(linker, serverRouterTime, req, res, next)
{
	if (!linker) return next();

	return httpAction(linker, serverRouterTime, req)
		.then(function(output)
		{
			res.statusCode = output.statusCode || 200;
			var data = output.data;
			data = json.stringify(data);
			data.CONST_KEY = json.CONST_KEY;

			res.set('XH-Httpproxy-ResponseTime', Date.now());
			res.json(data);
		});
}



function httpAction(linker, serverRouterTime, req)
{
	var deprecate_msg = [];
	var client_msg = [];

	var logmsg = 'route catch:' + formatLogTime(serverRouterTime);
	debug(logmsg);
	client_msg.push(logmsg);

	return rawBody(req)
		.then(function(buf)
		{
			var originalRaw = buf.toString();
			var originalBody = JSON.parse(originalRaw);
			var action = originalBody.action;
			var body = json.parse(originalBody.data, originalBody.CONST_KEY);

			return runAction(linker, action, serverRouterTime, body, req.headers, req.query, originalRaw, originalBody)
				.catch(function(err)
				{
					debug('[%s] linker run err:%o', action, err);
					return {
						statusCode: 500,
						data: { result: err }
					};
				})
				.then(function(output)
				{
					var endTime = new Date;
					var logmsg = 'clientlinker run end:'
						+ formatLogTime(endTime)
						+ ' ' + (endTime - serverRouterTime) + 'ms';
					debug(logmsg);
					client_msg.push(logmsg);

					return output;
				});
		})
		.catch(function(err)
		{
			var endTime = new Date;
			var logmsg = 'clientlinker run err:'
				+ ' ' + formatLogTime(endTime)
				+ ' ' + (endTime - serverRouterTime) + 'ms'
				+ ' msg=' + ((err && err.message) || err);
			debug(logmsg);
			client_msg.push(logmsg);

			return {
				statusCode: 500,
				data: { result: err }
			};
		})
		.then(function(output)
		{
			var data = output.data || (output.data = {});

			if (client_msg.length)
				data.httpproxy_msg = client_msg;
			if (deprecate_msg.length)
				data.httpproxy_deprecate = deprecate_msg;

			return output;
		});
}



function runAction(linker, action, serverRouterTime, body, headers, query, originalRaw)
{
	return linker.parseAction(action)
		.then(function(methodInfo)
		{
			if (!methodInfo.client) return { statusCode: 501 };

			var checkOptions = {
				linker: linker,
				client: methodInfo.client,
				action: action,
				serverRouterTime: serverRouterTime,
				headers: headers,
				body: body,
				query: query,
				originalRaw: originalRaw,
			};

			if (checkHttpproxyTime(checkOptions) === false
				|| checkHttpproxyKey(checkOptions) ===  false)
			{
				return { statusCode: 403 };
			}

			debug('[%s] catch proxy route', action);
			var args = [action, body.query, body.body, null, body.options];
			var env = _.extend({}, body.env, { httpproxyHeaders: headers, httpproxyQuery: query });
			var retPromise = linker.runIn(args, 'httpproxy', env);
			var runtime = linker.lastRuntime;
			// 重试的时候，需要将tmp传回去
			runtime.on('retry', function() {
				_.extend(this.tmp, body.tmp);
			});

			return retPromise.then(function(data)
				{
					// console.log('svr env for data', runtime.env);
					return { data: data };
				},
				function(err)
				{
					return { result: err };
				})
				.then(function(data)
				{
					data.env = runtime ? runtime.env : body.env;
					data.tmp = runtime ? runtime.tmp : body.tmp;

					if (data.result
						&& data.result.message
						&& data.result.message.substr(0, 21) == 'CLIENTLINKER:NotFound') {
						debug('[%s] %s', action, data.result);
						return {
							statusCode: 501,
							data: data
						};
					} else {
						return {
							statusCode: 200,
							data: data,
						};
					}
				});
		});
}


function formatLogTime(date)
{
	return date.getHours()
		+':'+date.getMinutes()
		+':'+date.getSeconds()
		+'.'+date.getMilliseconds();
}

function checkHttpproxyTime(checkOptions)
{
	var clientRequestTime = checkOptions.headers['xh-httpproxy-contenttime'];
	if (!clientRequestTime)
	{
		debug('[%s] no clientRequestTime:%s', checkOptions.action, clientRequestTime);
		return false;
	}

	var remain = checkOptions.serverRouterTime - clientRequestTime;
	var httpproxyKeyRemain = checkOptions.client.options.httpproxyKeyRemain || 5 * 1000;

	if ((!remain && remain !== 0) || Math.abs(remain) > httpproxyKeyRemain)
	{
		debug('[%s] key expired, remain:%sms config:%sms sever:%s, client:%s',
			checkOptions.action, remain, httpproxyKeyRemain,
			formatLogTime(checkOptions.serverRouterTime),
			formatLogTime(new Date(+clientRequestTime)));
		return false;
	}

	// 用内存cache稍微档一下重放的请求。避免扫描导致的大量错误
	var cacheList = checkOptions.linker.cache.httpproxyRequest || (checkOptions.linker.cache.httpproxyRequest = {});
	var cache = cacheList[httpproxyKeyRemain] || (cacheList[httpproxyKeyRemain] = new LRUCache(
		{
			maxAge: httpproxyKeyRemain * 2,
			max: 100 * 1000,
		}));

	var requestKey = checkOptions.headers['xh-httpproxy-key2']
		|| checkOptions.headers['xh-httpproxy-key'];

	if (requestKey)
	{
		var key = checkOptions.action + ':' + requestKey;
		if (cache.peek(key))
		{
			debug('[%s] siginkey has require: %s', checkOptions.action, requestKey);
			return false;
		}
		else
		{
			cache.set(key, true);
		}
	}
}

function checkHttpproxyKey(checkOptions)
{
	var httpproxyKey = checkOptions.client.options.httpproxyKey;
	// version2特性：
	// 所有请求都会带上来
	// 加密参数增加随机数
	// @todo 老版本兼容2个大版本
	var keyVersion = 2;
	var requestKey = checkOptions.headers['xh-httpproxy-key2'];
	if (!requestKey) {
		keyVersion = 1;
		requestKey = checkOptions.headers['xh-httpproxy-key'];
	}
	debug('[%s] httpproxyKey: %s keyversion: %s', checkOptions.action, httpproxyKey, keyVersion);

	if (keyVersion == 1 && !httpproxyKey) return;
	if (!requestKey)
	{
		debug('[%s] no httpproxy aes key', checkOptions.action);
		return false;
	}

	// if (httpproxyKey == key)
	// {
	// 	debug('[%s] pass:use original key', action);
	// 	return;
	// }

	var hashContent = signature.get_sha_content(checkOptions.originalRaw);
	var random = checkOptions.headers['xh-httpproxy-contenttime'];
	if (keyVersion == 2) random += checkOptions.query.random;
	var targetKey = signature.sha_content(hashContent, random, httpproxyKey);

	if (targetKey != requestKey)
	{
		debug('[%s] not match, time:%s cntMd5:%s %s retKey:%s %s',
			checkOptions.action, random,
			signature.md5(hashContent), checkOptions.headers['xh-httpproxy-debugmd5'],
			targetKey, requestKey);
		return false;
	}
}
