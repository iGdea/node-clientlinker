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

exports.initConfig = require('./initConfig');
exports.methods = require('./methods');

function hiproto(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	initClient(client)
		.then(function()
		{
			var clientAlias = options.hiprotoClientAlias || client.name;
			var handlerName = clientAlias+'.'+runtime.methodName;
			var handler = client.hiprotoServer[handlerName];

			if (typeof handler == 'function')
			{
				handler.call(client.hiprotoServer, runtime.query, runtime.body, callback,
					runtime.runOptions && runtime.runOptions.hiprotoNotParseBuffer);
			}
			else
			{
				debug('hiprotoServer has no method:%s', handlerName);
				callback.next();
			}
		},
		function(err)
		{
			debug('read hiproto des err, file:%s, err:%o', options.hiproto, err);
			callback.next();
		})
		.catch(callback.reject);
}


exports.initClient = initClient;
function initClient(client)
{
	var options = client.options;

	if (!client.hiprotoServer)
	{
		var servers = client.linker.hiprotoServers || (client.linker.hiprotoServers = {});
		client.hiprotoServer = servers[client.name];
		var hiprotoDesPath = options.hiproto;
		
		if (!client.hiprotoServer && hiprotoDesPath)
		{
			return new Promise(function(resolve, reject)
			{
				fs.readFile(hiprotoDesPath, function(err, content)
				{
					if (err)
					{
						reject(err);
					}
					else
					{
						client.hiprotoServer = servers[client.name] =
							new Service(content, options.hiprotoClientPath);

						resolve(client.hiprotoServer);
					}
				});
			});
		}
	}

	return client.hiprotoServer ?
		Promise.resolve(client.hiprotoServer) : Promise.reject('SERVICE NOT INITED');
}
