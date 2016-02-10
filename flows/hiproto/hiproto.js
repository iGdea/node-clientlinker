var fs		= require('fs');
var debug	= require('debug')('client_linker:hiproto');

var Service;
try {
	Service = require('mail.addon_hiproto').Service;
	exports = module.exports = hiproto;
}
catch(e)
{
	debug('load hiproto err:%o', e);
}


function hiproto(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	var promise = Promise.resolve();

	if (!client.hiprotoServer)
	{
		var servers = client.linker.hiprotoServers || (client.linker.hiprotoServers = {});
		client.hiprotoServer = servers[client.name];
		
		if (!client.hiprotoServer)
		{
			promise.then(function()
			{
				return new Promise(function(resolve, reject)
				{
					var hiprotoDesPath = options.hiproto;
					if (hiprotoDesPath)
					{
						// 直接自动化配置
						// if (hiprotoDesPath.substr(0, 5) == 'root:')
						// {
						// 	hiprotoDesPath = hiprotoDesPath.substr(5)+'/'+client.name+'.des';
						// }

						fs.readFile(hiprotoDesPath, function(err, content)
						{
							if (err)
							{
								debug('read hiproto des err, file:%s, err:%o', hiprotoDesPath, err);
								callback.next();
								promise = null;
							}
							else
							{
								client.hiprotoServer = servers[client.name] = new Service(content, options.hiprotoClientPath);
								resolve();
							}
						});
					}
				});
			});
		}
	}

	promise.then(function()
	{
		var handlerName = (options.hiprotoClientAlias || client.name)+'.'+runtime.methodName;
		var handler = client.hiprotoServer[handlerName];

		if (typeof handler == 'function')
		{
			handler.call(client.hiprotoServer, runtime.query, runtime.body, callback, runtime.runOptions);
		}
		else
		{
			debug('hiprotoServer has no method:%s', handlerName);
			callback.next();
		}
	});
}

hiproto.initConfig = require('./initConfig');
