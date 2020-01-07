'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const debug = require('debug')('clientlinker-flow-httpproxy');
const deprecate = require('depd')('clientlinker-flow-httpproxy');
const request = require('request');
const signature = require('../lib/signature');
const json = require('../lib/json');

exports = module.exports = httpproxy;

async function httpproxy(runtime, callback) {
	const requestBody = getRequestBody(runtime);
	if (!requestBody) return callback.next();

	const params = getRequestParams(runtime, requestBody);
	runtime.debug && runtime.debug('httpproxyRunParams', params);
	// headers 头部信息往往比其他部分更新神奇
	debug('<%s> httpproxyHeaders: %o, env: %o, tmp: %o', runtime.action, params.headers, requestBody.env, requestBody.tmp);
	const requestUniqKeyParams = _.extend({}, params, {
		url: appendUrl(runtime.client.options.httpproxy,
			'cgi=req_uniq_key'
			+ '&action=' + runtime.action
			+ '&random=' + Date.now() + (Math.random() * 100000 | 0)),
		body: JSON.stringify({ action: runtime.action })
	});

	const uniqKeyResult = await requestPromise(requestUniqKeyParams);
	if (uniqKeyResult.response.statusCode == 200) {
		const data = JSON.parse(uniqKeyResult.body);
		params.headers['XH-Httpproxy-UniqKey'] = data.uniq_key;
	} else {
		debug('get uniqkey error: %o', runtime.action);
	}

	const { response, body } = await requestPromise(params);
	const clientResponseTime = +response.responseStartTime;
	const serverResponseTime = +response.headers['xh-httpproxy-responsetime'];
	debug('clientResponseTime: %s serverResponseTime: %s, remain: %sms',
		clientResponseTime, serverResponseTime, serverResponseTime - clientResponseTime);
	let data;

	try {
		data = JSON.parse(body);
		data = json.parse(data, data.CONST_KEY) || {};
	}
	catch(err)
	{
		debug('request parse json err:%o params:%o body:%s', err, params, body);
		runtime.debug && runtime.debug('httpproxyResponseError', err);
		return callback.next();
	}

	// httpproxy运行后的变化，不需要同步过来
	// if (data.env) {
	// 	const keepEnv = { source: runtime.env.source };
	// 	_.extend(runtime.env, data.env, keepEnv);
	// }
	// if (data.tmp) {
	// 	const keepTmp = { httpproxyLevel: runtime.tmp.httpproxyLevel };
	// 	_.extend(runtime.tmp, data.tmp, keepTmp);
	// }

	if (data.tmp && data.tmp.httpproxyLevelTotal) {
		runtime.tmp.httpproxyLevelTotal = data.tmp.httpproxyLevelTotal;
	}

	// 预留接口，在客户端显示server端日志
	if (data.httpproxy_msg
		&& Array.isArray(data.httpproxy_msg)) {
		data.httpproxy_msg.forEach(msg => debug('[route response] %s', msg));
	}

	// 预留接口，在客户端现实server端兼容日志
	if (data.httpproxy_deprecate
		&& Array.isArray(data.httpproxy_deprecate)) {
		data.httpproxy_deprecate.forEach(msg => deprecate('[route response] '+msg));
	}

	if (response && response.statusCode != 200) {
		const err = new Error('httpproxy,response!200,'+response.statusCode);
		debug('request err:%o', err);
		if (response.statusCode == 501) {
			runtime.debug && runtime.debug('httpproxyResponseError', err);
			return callback.next();
		}

		throw err;
	}

	if (data.result)
		throw data.result;
	else
		return data.data;
}

exports.getRequestBody_ = getRequestBody;
function getRequestBody(runtime) {
	const client = runtime.client;
	const options = client.options;

	if (!options.httpproxy) return false;

	let httpproxyMaxLevel = options.httpproxyMaxLevel;
	let httpproxyNextLevel = runtime.tmp.httpproxyLevel || 0;
	let httpproxyLevelTotal = runtime.tmp.httpproxyLevelTotal || httpproxyNextLevel;
	httpproxyNextLevel++;
	httpproxyLevelTotal++;

	if ((!httpproxyMaxLevel && httpproxyMaxLevel !== 0)
		|| httpproxyMaxLevel < 0) {
		httpproxyMaxLevel = 1;
	}

	if (httpproxyNextLevel > httpproxyMaxLevel) {
		debug('[%s] not request httpproxy, level overflow:%d >= %d',
			runtime.action, httpproxyNextLevel, httpproxyMaxLevel);
		return false;
	}

	runtime.tmp.httpproxyLevel = httpproxyNextLevel;
	runtime.tmp.httpproxyLevelTotal = httpproxyLevelTotal;

	const body = {
		query	: runtime.query,
		body	: runtime.body,
		options	: runtime.options,
		env		: runtime.env,
		tmp		: runtime.tmp,
	};

	return body;
}


const urlCache = {};
exports.appendUrl_ = appendUrl;
function appendUrl(url, query) {
	let rootUrl = urlCache[url];

	if (!rootUrl) {
		const lastChar = url.charAt(url.length-1);
		const splitChar = lastChar == '?' || lastChar == '&'
				? '' : (url.indexOf('?') != -1 ? '&' : '?');
		rootUrl = urlCache[url] = url + splitChar;
	}

	return  rootUrl + query;
}

exports.getRequestParams_ = getRequestParams;
function getRequestParams(runtime, body)
{
	const client = runtime.client;
	const options = client.options;
	const runOptions = runtime.options || {};
	const timeout = runOptions.timeout || options.httpproxyTimeout || 10000;
	let proxy = runOptions.httpproxyProxy
			|| options.httpproxyProxy
			|| process.env.clientlinker_http_proxy
			|| process.env.http_proxy;

	if (runOptions.httpproxyProxy === false || (!runOptions.httpproxyProxy && options.httpproxyProxy === false)) {
		proxy = false;
	}

	const headers = _.extend({}, options.httpproxyHeaders, runOptions.httpproxyHeaders);
	headers['Content-Type'] = 'application/json';
	const random = Math.random() * 10000000000 | 0;

	const postBody = {
		action: runtime.action,
		data: json.stringify(body),
		CONST_KEY: json.CONST_KEY,
	};

	const bodystr = JSON.stringify(postBody, null, '\t')
		.replace(/\n/g, '\r\n');

	// 增加对内容的签名
	// 内容可能会超级大，所以分批计算签名
	// 并且requestStartTime要尽量精确
	const hashContent = signature.get_sha_content(bodystr);
	headers['XH-Httpproxy-DebugMd5'] = signature.md5(hashContent);

	const requestStartTime = Date.now();
	// @todo key1 保留2个大版本
	if (options.httpproxyKey) {
		headers['XH-Httpproxy-Key'] = signature.sha_content(hashContent, requestStartTime, options.httpproxyKey);
	}
	headers['XH-Httpproxy-Key2'] = signature.sha_content(hashContent, '' + requestStartTime + random, options.httpproxyKey);
	headers['XH-Httpproxy-ContentTime'] = requestStartTime;

	// URL 上的action只是为了方便查看抓包请求
	// 实际以body.action为准
	const url = appendUrl(options.httpproxy, 'cgi=http_action&action=' + runtime.action + '&random=' + random);

	return {
		url		: url,
		body	: bodystr,
		headers	: headers,
		timeout	: timeout,
		proxy	: proxy,
		time	: true,
	};
}

function requestPromise(params) {
	return new Promise((resolve, reject) => {
		request.post(params, (err, response, body) => {
			if (err)
				reject(err);
			else
				resolve({ response: response, body: body });
		});
	});
}
