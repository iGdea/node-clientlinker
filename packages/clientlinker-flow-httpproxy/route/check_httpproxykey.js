'use strict';

var debug		= require('debug')('clientlinker-flow-httpproxy:route');
var signature	= require('../lib/signature');

module.exports = checkHttpproxyKey;

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

	return true;
}
