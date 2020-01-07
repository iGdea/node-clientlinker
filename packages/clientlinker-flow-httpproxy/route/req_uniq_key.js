'use strict';
var Promise	= require('bluebird');
var rawBody	= Promise.promisify(require('raw-body'));
var aesid = require('aesid');


exports = module.exports = reqUniqKey;
function reqUniqKey(linker, req) {
	return rawBody(req)
		.then(function (buf) {
			var data = JSON.parse(buf.toString());
			var action = data.action;

			return linker.parseAction(action);
		})
		.then(function(methodInfo) {
			if (!methodInfo.client) return { statusCode: 501 };

			var aesObj = getAesObj(methodInfo.client);
			var content = [Date.now(), process.pid, Math.random() * 100000000 | 0].join(',');

			return {
				statusCode: 200,
				data: { uniq_key: aesObj.encrypt(content) }
			};
		});
}

exports.getAesObj = getAesObj;
function getAesObj(client) {
	var aesObj = client.cache.httpproxyAesObj;

	if (!aesObj) {
		aesObj = client.cache.httpproxyAesObj
			= aesid(client.options.httpproxyKey || 'httpproxy@key', { userid: false });
	}

	return aesObj;
}
