'use strict';

var debug		= require('debug')('clientlinker-flow-httpproxy:route');
var LRUCache	= require('lru-cache');
var reqUniqKey	= require('./req_uniq_key');
var utils		= require('../lib/utils');

module.exports = checkHttpproxyUniqKey;
function checkHttpproxyUniqKey(checkOptions) {
	var uniqkey = checkOptions.headers['xh-httpproxy-uniqkey'];
	if (!uniqkey)
	{
		debug('[%s] no uniqkey:%s', checkOptions.action, uniqkey);
		return;
	}

	var aesObj = reqUniqKey.getAesObj(checkOptions.client);
	var httpproxyKeyRemain = checkOptions.client.options.httpproxyKeyRemain || 5 * 1000;

	var content;
	try {
		content = aesObj.decrypt(uniqkey);
	} catch(err) {
		debug('[%s] aes decrypt err: %o', checkOptions.action, err);
		return false;
	}

	var requestTime = content.split(',')[0];
	if (!requestTime) {
		debug('[%s] no requestTime', checkOptions.action);
		return false;
	}

	var remain = checkOptions.serverRouterTime - requestTime;
	if ((!remain && remain !== 0) || Math.abs(remain) > httpproxyKeyRemain) {
		debug('[%s] uniqkey expired, remain:%sms config:%sms sever:%s, client:%s',
			checkOptions.action, remain, httpproxyKeyRemain,
			utils.formatLogTime(checkOptions.serverRouterTime),
			utils.formatLogTime(new Date(+requestTime)));
		return false;
	}

	var cacheList = checkOptions.linker.cache.httpproxyUniqkeys || (checkOptions.linker.cache.httpproxyUniqkeys = {});
	var cache = cacheList[httpproxyKeyRemain] || (cacheList[httpproxyKeyRemain] = new LRUCache(
		{
			maxAge: httpproxyKeyRemain * 2,
			max: httpproxyKeyRemain * 100,
		}));

	var key = checkOptions.action + ':' + content;
	if (cache.peek(key)) {
		debug('[%s] siginkey has require: %s', checkOptions.action, content);
		return false;
	} else {
		cache.set(key, true);
	}

	return true;
}
