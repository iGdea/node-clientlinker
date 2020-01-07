'use strict';

var debug		= require('debug')('clientlinker-flow-httpproxy:route');
var LRUCache	= require('lru-cache');
var utils		= require('../lib/utils');

module.exports = checkHttpproxyTime;

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
			utils.formatLogTime(checkOptions.serverRouterTime),
			utils.formatLogTime(new Date(+clientRequestTime)));
		return false;
	}

	// 用内存cache稍微档一下重放的请求。避免扫描导致的大量错误
	var cacheList = checkOptions.linker.cache.httpproxyRequest || (checkOptions.linker.cache.httpproxyRequest = {});
	var cache = cacheList[httpproxyKeyRemain] || (cacheList[httpproxyKeyRemain] = new LRUCache(
		{
			maxAge: httpproxyKeyRemain * 2,
			max: httpproxyKeyRemain * 100,
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

	return true;
}
