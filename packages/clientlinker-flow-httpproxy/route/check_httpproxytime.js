/**
 * 校验数据时效性和唯一性
 *
 * 待废弃
 * 使用 check_httpproxyuniqkey 替换
 * 服务器时间和本地时间可能不一致，或者线程通讯卡顿；容易导致数据校验失败
 */

'use strict';

let debug		= require('debug')('clientlinker-flow-httpproxy:route');
let LRUCache	= require('lru-cache');
let utils		= require('../lib/utils');

module.exports = checkHttpproxyTime;

function checkHttpproxyTime(checkOptions)
{
	let clientRequestTime = checkOptions.headers['xh-httpproxy-contenttime'];
	if (!clientRequestTime)
	{
		debug('[%s] no clientRequestTime:%s', checkOptions.action, clientRequestTime);
		return;
	}

	let remain = checkOptions.serverRouterTime - clientRequestTime;
	let httpproxyKeyRemain = checkOptions.client.options.httpproxyKeyRemain || 5 * 1000;

	if ((!remain && remain !== 0) || Math.abs(remain) > httpproxyKeyRemain)
	{
		debug('[%s] key expired, remain:%sms config:%sms sever:%s, client:%s',
			checkOptions.action, remain, httpproxyKeyRemain,
			utils.formatLogTime(checkOptions.serverRouterTime),
			utils.formatLogTime(new Date(+clientRequestTime)));
		return false;
	}

	// 用内存cache稍微档一下重放的请求。避免扫描导致的大量错误
	let cacheList = checkOptions.linker.cache.httpproxyKeys || (checkOptions.linker.cache.httpproxyKeys = {});
	let cache = cacheList[httpproxyKeyRemain] || (cacheList[httpproxyKeyRemain] = new LRUCache({
		maxAge: httpproxyKeyRemain * 2,
		max: 10000,
	}));

	let requestKey = checkOptions.headers['xh-httpproxy-key2']
		|| checkOptions.headers['xh-httpproxy-key'];

	if (requestKey)
	{
		let key = checkOptions.action + ':' + requestKey;
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
