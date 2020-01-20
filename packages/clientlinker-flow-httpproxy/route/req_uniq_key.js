'use strict';
let Promise	= require('bluebird');
let rawBody	= Promise.promisify(require('raw-body'));
let aesid = require('aesid');


exports = module.exports = reqUniqKey;
function reqUniqKey(linker, req) {
	return rawBody(req)
		.then(function (buf) {
			let data = JSON.parse(buf.toString());
			let action = data.action;

			return linker.parseAction(action);
		})
		.then(function(methodInfo) {
			if (!methodInfo.client) return { statusCode: 501 };

			let aesObj = getAesObj(methodInfo.client);
			let content = [Date.now(), process.pid, Math.random() * 100000000 | 0].join(',');

			return {
				statusCode: 200,
				data: { uniq_key: aesObj.encrypt(content) }
			};
		});
}

exports.getAesObj = getAesObj;
function getAesObj(client) {
	let aesObj = client.cache.httpproxyAesObj;

	if (!aesObj) {
		aesObj = client.cache.httpproxyAesObj
			= aesid(client.options.httpproxyKey || 'httpproxy@key', { userid: false });
	}

	return aesObj;
}
