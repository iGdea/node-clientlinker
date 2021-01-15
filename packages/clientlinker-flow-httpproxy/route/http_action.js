'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const debug = require('debug')('clientlinker-flow-httpproxy:route');
const rawBody = Promise.promisify(require('raw-body'));
const json = require('../lib/json');
const utils = require('../lib/utils');

const checkHttpproxyTime = require('./check_httpproxytime');
const checkHttpproxyKey = require('./check_httpproxykey');
const checkHttpproxyUniqKey = require('./check_httpproxyuniqkey');

module.exports = httpAction;

function httpAction(linker, serverRouterTime, req) {
	const deprecate_msg = [];
	const client_msg = [];

	const logmsg = 'route catch:' + utils.formatLogTime(serverRouterTime);
	debug(logmsg);
	client_msg.push(logmsg);

	// 重试的时候，需要将tmp传回去
	linker.on('retry', function({ runtime }) {
		if (runtime._httpproxyBobyTmp) {
			_.extend(runtime.tmp, runtime._httpproxyBobyTmp);
		}
	});

	return rawBody(req)
		.then(function(buf) {
			const originalRaw = buf.toString();
			const originalBody = JSON.parse(originalRaw);
			const action = originalBody.action;
			const body = json.parse(originalBody.data, originalBody.CONST_KEY);

			return runAction(
				linker,
				action,
				serverRouterTime,
				body,
				req.headers,
				req.query,
				originalRaw,
				originalBody
			)
				.catch(function(err) {
					debug('[%s] linker run err:%o', action, err);
					return {
						statusCode: 500,
						data: { result: err }
					};
				})
				.then(function(output) {
					const endTime = new Date();
					const logmsg =
						'clientlinker run end:' +
						utils.formatLogTime(endTime) +
						' ' +
						(endTime - serverRouterTime) +
						'ms';
					debug(logmsg);
					client_msg.push(logmsg);

					return output;
				});
		})
		.catch(function(err) {
			const endTime = new Date();
			const logmsg =
				'clientlinker run err:' +
				' ' +
				utils.formatLogTime(endTime) +
				' ' +
				(endTime - serverRouterTime) +
				'ms' +
				' msg=' +
				((err && err.message) || err);
			debug(logmsg);
			client_msg.push(logmsg);

			return {
				statusCode: 500,
				data: { result: err }
			};
		})
		.then(function(output) {
			let data = output.data || (output.data = {});

			if (client_msg.length) data.httpproxy_msg = client_msg;
			if (deprecate_msg.length) data.httpproxy_deprecate = deprecate_msg;

			data = json.stringify(data);
			data.CONST_KEY = json.CONST_KEY;
			output.data = data;

			return output;
		});
}

function runAction(
	linker,
	action,
	serverRouterTime,
	body,
	headers,
	query,
	originalRaw
) {
	return linker.parseAction(action).then(function(methodInfo) {
		if (!methodInfo.client) return { statusCode: 501 };

		const checkOptions = {
			linker: linker,
			client: methodInfo.client,
			action: action,
			serverRouterTime: serverRouterTime,
			headers: headers,
			body: body,
			query: query,
			originalRaw: originalRaw
		};

		const httpproxyUniqKeyRet = checkHttpproxyUniqKey(checkOptions);
		if (
			httpproxyUniqKeyRet === false ||
			(!httpproxyUniqKeyRet &&
				checkHttpproxyTime(checkOptions) === false) ||
			checkHttpproxyKey(checkOptions) === false
		) {
			return { statusCode: 403 };
		}

		debug('[%s] catch proxy route', action);

		const args = [action, body.query, body.body, null, body.options];
		const env = _.extend({}, body.env, {
			httpproxyHeaders: headers,
			httpproxyQuery: query
		});
		const retPromise = linker.runIn(args, 'httpproxy', env);
		const runtime = linker.lastRuntime;
		runtime._httpproxyBobyTmp = body.tmp;

		return retPromise
			.then(
				function(data) {
					// console.log('svr env for data', runtime.env);
					return { data: data };
				},
				function(err) {
					return { result: err };
				}
			)
			.then(function(data) {
				data.env = runtime ? runtime.env : body.env;
				data.tmp = runtime ? runtime.tmp : body.tmp;

				if (
					data.result &&
					data.result.message &&
					data.result.message.substr(0, 21) == 'CLIENTLINKER:NotFound'
				) {
					debug('[%s] %s', action, data.result);
					return {
						statusCode: 501,
						data: data
					};
				} else {
					return {
						statusCode: 200,
						data: data
					};
				}
			});
	});
}
