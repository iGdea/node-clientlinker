"use strict";

var debug	= require('debug')('clientlinker:pkghandler');

exports = module.exports = pkghandler;
exports.initConfig	= require('./initConfig');
exports.methods		= require('./methods');

function pkghandler(runtime, callback)
{
	var client = runtime.client;
	var mod = initClient(client);

	if (!mod) return callback.next();
	var handler = mod[runtime.method];

	if (handler)
	{
		return handler(runtime.query, runtime.body, callback, runtime.options);
	}
	else
	{
		debug('pkg no handler:%s', runtime.method);
		return callback.next();
	}
}


exports.initClient = initClient;
function initClient(client)
{
	var options		= client.options;
	var linker		= client.linker;
	var retryTimes	= linker.pkghandlerRetryTimes || (linker.pkghandlerRetryTimes = {});
	if (!options.pkghandler) return;

	if (!client.pkghandlerModuleLoaded)
	{
		if (options.debug || !retryTimes[client.name] || retryTimes[client.name] < 3)
		{
			try {
				client.pkghandlerModule = require(options.pkghandler);
				client.pkghandlerModuleLoaded = true;
			}
			catch(e)
			{
				if (retryTimes[client.name])
					retryTimes[client.name]++;
				else
					retryTimes[client.name] = 1;

				debug('load pkg err:%o', e);

				// 屏蔽这个逻辑
				// 插件加载失败切换到httproxy，暂时依赖这个容错

				// pkghandler如果有定义，那么就一定要能加载成功
				// 如果加载失败，则返回错误，并将e输出给调用方
				// 接口是否存在，以及client是否真的有，都在后面逻辑继续判断
				// throw e;
			}
		}
		// else
		// {
		// 	throw new Error('Cannot load pkg:'+options.pkghandler);
		// }
	}

	return client.pkghandlerModule;
}
