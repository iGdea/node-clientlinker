const _ = require('lodash');
const debug = require('debug')('clientlinker-flow-httpproxy');
// const deprecate = require('depd')('clientlinker-flow-httpproxy');
const request = require('request');
const signature = require('../lib/signature');
const json = require('../lib/json');

exports = module.exports = httpproxy;

async function httpproxy(runtime, callback) {
	const requestBody = getRequestBody(runtime);
	if (!requestBody) return callback.next();

	// 注意：要比uniqKey先组装数据
	// 组装数据可能需要很长的时间
	const params = getRequestParams(runtime, requestBody);
	runtime.debug && runtime.debug('httpproxyRunParams', params);

	if (runtime.client.options.httpproxyEnableUniqKey !== false) {
		const requestUniqKeyParams = getRequestParams(
			runtime,
			{},
			'req_uniq_key'
		);

		const uniqKeyResult = await requestPromise(requestUniqKeyParams);
		if (uniqKeyResult.response.statusCode == 200) {
			const data = JSON.parse(uniqKeyResult.body);
			params.headers['XH-Httpproxy-UniqKey'] = data.uniq_key;
		} else {
			debug('get uniqkey error: %o', runtime.action);
		}
	}

	appendRequestTimeHeader(runtime, params);

	// headers 头部信息往往比其他部分更新神奇
	debug(
		'<%s> httpproxyHeaders: %o, env: %o',
		runtime.action,
		params.headers,
		requestBody.env,
	);

	const { response, body } = await requestPromise(params);
	// const clientResponseTime = +response.responseStartTime;
	// const serverResponseTime = +response.headers['xh-httpproxy-responsetime'];
	// debug('clientResponseTime: %s serverResponseTime: %s, remain: %sms',
	// 	clientResponseTime, serverResponseTime, serverResponseTime - clientResponseTime);
	let data;

	try {
		data = JSON.parse(body);
		data = json.parse(data, data.CONST_KEY) || {};
	} catch (err) {
		debug('request parse json err:%o params:%o body:%s', err, params, body);
		runtime.debug && runtime.debug('httpproxyResponseError', err);
		return callback.next();
	}

	// 预留接口，在客户端显示server端日志
	if (data.httpproxy_msg && Array.isArray(data.httpproxy_msg)) {
		data.httpproxy_msg.forEach(msg => debug('[route response] %s', msg));
	}

	if (response && response.statusCode !== 200) {
		const err = new Error('httpproxy,response!200,' + response.statusCode);
		debug('request err:%o', err);
		if (response.statusCode === 501) {
			runtime.debug && runtime.debug('httpproxyResponseError', err);
			return callback.next();
		}

		throw err;
	}

	if (data.result) throw data.result;
	else return data.data;
}

exports.getRequestBody_ = getRequestBody;
function getRequestBody(runtime) {
	const client = runtime.client;
	const options = client.options;

	if (!options.httpproxy) return false;

	let httpproxyMaxLevel = options.httpproxyMaxLevel;
	let httpproxyNextLevel = runtime.env.httpproxyLevel || 0;
	httpproxyNextLevel++;

	if (
		(!httpproxyMaxLevel && httpproxyMaxLevel !== 0) ||
		httpproxyMaxLevel < 0
	) {
		httpproxyMaxLevel = 1;
	}

	if (httpproxyNextLevel > httpproxyMaxLevel) {
		debug(
			'[%s] not request httpproxy, level overflow:%d >= %d',
			runtime.action,
			httpproxyNextLevel,
			httpproxyMaxLevel
		);
		return false;
	}

	const body = {
		query: runtime.query,
		body: runtime.body,
		options: runtime.options,
		env: {
			...runtime.env,
			httpproxyLevel: httpproxyNextLevel,
		},
	};

	return body;
}

exports.appendUrl_ = appendUrl;
function appendUrl(url, query) {
	const lastChar = url.charAt(url.length - 1);
	const splitChar =
		lastChar == '?' || lastChar == '&'
			? ''
			: url.indexOf('?') != -1
			? '&'
			: '?';

	return url + splitChar + query;
}

exports.getRequestParams_ = getRequestParams;
function getRequestParams(runtime, body, cginame) {
	if (!cginame) cginame = 'http_action';

	const client = runtime.client;
	const options = client.options;
	const runOptions = runtime.options || {};
	let proxy =
		runOptions.httpproxyProxy ||
		options.httpproxyProxy ||
		process.env.clientlinker_http_proxy ||
		process.env.http_proxy;

	if (
		runOptions.httpproxyProxy === false ||
		(!runOptions.httpproxyProxy && options.httpproxyProxy === false)
	) {
		proxy = false;
	}

	const headers = _.extend(
		{},
		options.httpproxyHeaders,
		runOptions.httpproxyHeaders
	);
	headers['Content-Type'] = 'application/json';
	const random = (Math.random() * 10000000000) | 0;

	const postBody = {
		action: runtime.action,
		data: json.stringify(body),
		CONST_KEY: json.CONST_KEY
	};

	const bodystr = JSON.stringify(postBody, null, '\t').replace(/\n/g, '\r\n');

	// URL 上的action只是为了方便查看抓包请求
	// 实际以body.action为准
	// 增加runOptions.httpproxyUrl，方便后续动态调整 path等信息（中心化转发时）
	const url = appendUrl(
		runOptions.httpproxyUrl || options.httpproxy,
		'cgi=' + cginame + '&action=' + runtime.action + '&random=' + random
	);

	return {
		url: url,
		body: bodystr,
		headers: headers,
		proxy: proxy,
		time: true,
		random: random
	};
}

exports.appendRequestTimeHeader_ = appendRequestTimeHeader;
function appendRequestTimeHeader(runtime, params) {
	const options = runtime.client.options;
	const headers = params.headers || (params.headers = {});
	// 增加对内容的签名
	// 内容可能会超级大，所以分批计算签名
	// 并且requestStartTime要尽量精确
	const hashContent = signature.get_sha_content(params.body);
	headers['XH-Httpproxy-DebugMd5'] = signature.md5(hashContent);

	const requestStartTime = Date.now();
	// @todo key1 保留2个大版本
	if (options.httpproxyKey) {
		headers['XH-Httpproxy-Key'] = signature.sha_content(
			hashContent,
			requestStartTime,
			options.httpproxyKey
		);
	}
	headers['XH-Httpproxy-Key2'] = signature.sha_content(
		hashContent,
		'' + requestStartTime + params.random,
		options.httpproxyKey
	);
	headers['XH-Httpproxy-ContentTime'] = requestStartTime;

	return params;
}

function requestPromise(params) {
	return new Promise((resolve, reject) => {
		request.post(params, (err, response, body) => {
			if (err) reject(err);
			else resolve({ response: response, body: body });
		});
	});
}
