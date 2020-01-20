/**
 * 校验数据时效性和唯一性
 */

'use strict';

let debug = require('debug')('clientlinker-flow-httpproxy:route');
let LRUCache = require('lru-cache');
let reqUniqKey = require('./req_uniq_key');
let utils = require('../lib/utils');

module.exports = checkHttpproxyUniqKey;
function checkHttpproxyUniqKey(checkOptions) {
	let uniqkey = checkOptions.headers['xh-httpproxy-uniqkey'];
	if (!uniqkey) {
		debug('[%s] no uniqkey:%s', checkOptions.action, uniqkey);
		return checkOptions.client.options.httpproxyEnableUniqKey === true
			? false
			: undefined;
	}

	let aesObj = reqUniqKey.getAesObj(checkOptions.client);
	let httpproxyKeyRemain =
		checkOptions.client.options.httpproxyKeyRemain || 5 * 1000;

	let content;
	try {
		content = aesObj.decrypt(uniqkey);
	} catch (err) {
		debug('[%s] aes decrypt err: %o', checkOptions.action, err);
		return false;
	}

	let requestTime = content.split(',')[0];
	if (!requestTime) {
		debug('[%s] no requestTime', checkOptions.action);
		return false;
	}

	let remain = checkOptions.serverRouterTime - requestTime;
	if ((!remain && remain !== 0) || Math.abs(remain) > httpproxyKeyRemain) {
		debug(
			'[%s] uniqkey expired, remain:%sms config:%sms sever:%s, client:%s',
			checkOptions.action,
			remain,
			httpproxyKeyRemain,
			utils.formatLogTime(checkOptions.serverRouterTime),
			utils.formatLogTime(new Date(+requestTime))
		);
		return false;
	}

	let cacheList =
		checkOptions.linker.cache.httpproxyUniqkeys ||
		(checkOptions.linker.cache.httpproxyUniqkeys = {});
	let cache =
		cacheList[httpproxyKeyRemain] ||
		(cacheList[httpproxyKeyRemain] = new LRUCache({
			maxAge: httpproxyKeyRemain * 2,
			max: 10000
		}));

	let key = checkOptions.action + ':' + content;
	if (cache.peek(key)) {
		debug('[%s] siginkey has require: %s', checkOptions.action, content);
		return false;
	} else {
		cache.set(key, true);
	}

	return true;
}
