/**
 * 校验数据完整性
 */

'use strict';

let debug = require('debug')('clientlinker-flow-httpproxy:route');
let signature = require('../lib/signature');

module.exports = checkHttpproxyKey;

function checkHttpproxyKey(checkOptions) {
	let httpproxyKey = checkOptions.client.options.httpproxyKey;
	// version2特性：
	// 所有请求都会带上来
	// 加密参数增加随机数
	// @todo 老版本兼容2个大版本
	let keyVersion = 2;
	let requestKey = checkOptions.headers['xh-httpproxy-key2'];
	if (!requestKey) {
		keyVersion = 1;
		requestKey = checkOptions.headers['xh-httpproxy-key'];
	}
	debug(
		'[%s] httpproxyKey: %s keyversion: %s',
		checkOptions.action,
		httpproxyKey,
		keyVersion
	);

	if (keyVersion == 1 && !httpproxyKey) return;
	if (!requestKey) {
		debug('[%s] no httpproxy aes key', checkOptions.action);
		return false;
	}

	// if (httpproxyKey == key)
	// {
	// 	debug('[%s] pass:use original key', action);
	// 	return;
	// }

	let hashContent = signature.get_sha_content(checkOptions.originalRaw);
	let random = checkOptions.headers['xh-httpproxy-contenttime'];
	if (keyVersion == 2) random += checkOptions.query.random;
	let targetKey = signature.sha_content(hashContent, random, httpproxyKey);

	if (targetKey != requestKey) {
		debug(
			'[%s] not match, time:%s cntMd5:%s %s retKey:%s %s',
			checkOptions.action,
			random,
			signature.md5(hashContent),
			checkOptions.headers['xh-httpproxy-debugmd5'],
			targetKey,
			requestKey
		);
		return false;
	}

	return true;
}
