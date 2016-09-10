"use strict";

var Promise		= require('bluebird');
var _			= require('underscore');
var debug		= require('debug')('clientlinker:httpproxy:route');
var aes			= require('../../lib/aes_cipher');
var rawBody		= require('raw-body');
var oldJSON		= require('../../lib/json');
var deprecate	= require('depd')('clientlinker:httpproxy:route');

exports = module.exports = HttpProxyRoute;

function HttpProxyRoute(linker)
{
	if (!linker) return function(req, res, next){next()};
	linker.__bind_httpproxy_route__ = true;

	return function HttpProxyRouteHandle(req, res, next)
	{
		var action = req.query.action;
		if (!action) return next();

		var deprecate_msg = [];
		var client_msg = [];
		var startTime = new Date;

		var logmsg = 'route catch:' + formatLogTime(startTime);
		debug(logmsg);
		client_msg.push(logmsg);

		return new Promise(function(resolve, reject)
			{
				rawBody(req, function(err, buf)
				{
					err ? reject(err) : resolve(buf);
				});
			})
			.then(function(buf)
			{
				var body = buf.toString();
				var isOldJSONparse = false;
				if (req.get('Content-Parser') == 'jsonk')
				{
					body = linker.JSON.parseFromString(body);
					debug('parse body result:%o', body);
				}
				else
				{
					deprecate('update clientklinker, CONST_VARS JSON')
					deprecate_msg.push('update clientklinker, CONST_VARS JSON');

					body = JSON.parse(body);
					body = oldJSON.parse(body, body.CONST_VARS);
					isOldJSONparse = true;
				}

				return runAction(linker, action, body)
					.catch(function(err)
					{
						debug('[%s] linker run err:%o', action, err);
						return {
							statusCode: 500,
							env: body && body.env,
							result: err
						};
					})
					.then(function(data)
					{
						res.statusCode = data.statusCode || 200;
						var output = {
							env: data.env,
							result: data.result,
							data: data.data
						};

						var endTime = new Date;
						var logmsg = 'clientlinker run end:'
							+ formatLogTime(endTime)
							+ ' ' + (endTime - startTime) + 'ms';
						debug(logmsg);
						client_msg.push(logmsg);

						if (client_msg.length)
							output.httpproxy_msg = client_msg;
						if (deprecate_msg.length)
							output.httpproxy_deprecate = deprecate_msg;

						if (isOldJSONparse)
						{
							output.CONST_VARS = oldJSON.CONST_VARS;
							output = oldJSON.stringify(output);
							res.json(output);
						}
						else
						{
							// 使用普通json，方便做Fiddler的兼容
							res.json(linker.JSON.stringify(output));
						}
					});
			})
			.catch(function(err)
			{
				var endTime = new Date;
				var logmsg = 'clientlinker run err:'
					+ ' action='+action
					+ ' ' + formatLogTime(endTime)
					+ ' ' + (endTime - startTime) + 'ms'
					+ ' stack=' + ((err && err.stack) || err);
				debug(logmsg);
				client_msg.push(logmsg);

				var output = {};
				if (client_msg.length)
					output.httpproxy_msg = client_msg;
				if (deprecate_msg.length)
					output.httpproxy_deprecate = deprecate_msg;

				res.statusCode = 500;
				res.json(output);
			});
	};
}


function runAction(linker, action, body)
{
	return linker.parseAction(action)
		.then(function(methodInfo)
		{
			var options = methodInfo.client && methodInfo.client.options;

			if (checkHttpproxyKey(action, body, options) ===  false)
				return {statusCode: 403};

			debug('[%s] catch proxy route', action);
			var args = [action, body.query, body.body, null, body.options];
			var retPromise = linker.runIn(args, 'httpproxy', body.env);

			return retPromise.then(function(data)
				{
					var runtime = retPromise.runtime;
					// console.log('svr env for data', runtime.env);
					return {
						statusCode: 200,
						env: runtime.env,
						data: data
					};
				})
				.catch(function(err)
				{
					var runtime = retPromise.runtime;
					var output = {
						env: runtime ? runtime.env : body.env,
						result: err
					};

					// console.log('svr env for err', env);
					if (err
						&& (err.CLIENTLINKER_TYPE == 'CLIENT FLOW OUT'
							|| err.CLIENTLINKER_TYPE == 'CLIENT NO FLOWS'
							|| err.CLIENTLINKER_TYPE == 'NO CLIENT'))
					{
						debug('[%s] %s', action, err);
						output.statusCode = 501;
					}
					else
					{
						output.statusCode = 200;
					}

					return output;
				});
		});
}


function formatLogTime(date)
{
	return date.getHours()
		+':'+date.getMinutes()
		+':'+date.getSeconds()
		+'.'+date.getMilliseconds();
}


exports.checkHttpproxyKey = checkHttpproxyKey;
function checkHttpproxyKey(action, body, options)
{
	options || (options = {});
	var httpproxyKey = options.httpproxyKey;
	var httpproxyKeyRemain = options.httpproxyKeyRemain || 15*60*1000;

	debug('httpproxyKey: %s, remain:%sms', httpproxyKey, httpproxyKeyRemain);

	if (!httpproxyKey) return;
	if (!body.key)
	{
		debug('[%s] no httpproxy aes key', action);
		return false;
	}

	if (httpproxyKey == body.key)
	{
		debug('[%s] pass:use body key', action);
		return;
	}

	var realAction, remain;
	try {
		realAction = aes.decipher(body.key, httpproxyKey).split(',');
	}
	catch(err)
	{
		debug('[%s] can not decipher key:%s, err:%o', action, body.key, err);
		return false;
	}

	remain = Date.now() - realAction.pop();
	realAction = realAction.join(',');

	if (remain > httpproxyKeyRemain)
	{
		debug('[%s] key expired, remain:%sms', action, remain);
		return false;
	}

	if (realAction != action)
	{
		debug('[%s] inval aes key, aes:%s', action, realAction);
		return false;
	}
}
