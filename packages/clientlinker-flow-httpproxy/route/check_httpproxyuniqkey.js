/**
 * 校验数据时效性和唯一性
 */

const debug = require('debug')('clientlinker-flow-httpproxy:route');
const LRUCache = require('lru-cache');
const reqUniqKey = require('./req_uniq_key');
const utils = require('../lib/utils');

module.exports = checkHttpproxyUniqKey;
function checkHttpproxyUniqKey(checkOptions) {
	const uniqkey = checkOptions.headers['xh-httpproxy-uniqkey'];
	if (!uniqkey) {
		debug('[%s] no uniqkey:%s', checkOptions.action, uniqkey);
		return checkOptions.client.options.httpproxyEnableUniqKey === true
			? false
			: undefined;
	}

	const aesObj = reqUniqKey.getAesObj(checkOptions.client);
	const httpproxyKeyRemain =
		checkOptions.client.options.httpproxyKeyRemain || 5 * 1000;

	let content;
	try {
		content = aesObj.decrypt(uniqkey);
	} catch (err) {
		debug('[%s] aes decrypt err: %o', checkOptions.action, err);
		return false;
	}

	const requestTime = content.split(',')[0];
	if (!requestTime) {
		debug('[%s] no requestTime', checkOptions.action);
		return false;
	}

	const remain = checkOptions.serverRouterTime - requestTime;
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

	const cacheList =
		checkOptions.linker.cache.httpproxyUniqkeys ||
		(checkOptions.linker.cache.httpproxyUniqkeys = {});
	const cache =
		cacheList[httpproxyKeyRemain] ||
		(cacheList[httpproxyKeyRemain] = new LRUCache({
			maxAge: httpproxyKeyRemain * 2,
			max: 10000
		}));

	const key = checkOptions.action + ':' + content;
	if (cache.peek(key)) {
		debug('[%s] siginkey has require: %s', checkOptions.action, content);
		return false;
	} else {
		cache.set(key, true);
	}

	return true;
}
