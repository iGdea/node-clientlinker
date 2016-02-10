var _ = require('underscore');
var domain = require('domain');
var debug = require('debug')('client_linker:main');

exports.Linker = Linker;
function Linker()
{
	this._clients = {};
	this.clients = Promise.resolve(this._clients);
	this.flows = {};
}

Linker.prototype = {
	add: function(clientName, options)
	{
		var client = this._clients[clientName];

		if (client)
			_.extend(client.options, options);
		else
			client = this._clients[clientName] = new Client(clientName, this, options);

		return client;
	},
	bind: function(flowName, handler)
	{
		this.flows[flowName] = handler;
	},
	initConfig: function(options)
	{
		var self = this;
		var running = _.map(self.flows, function(handler)
		{
			if (typeof handler.initConfig == 'function')
			{
				var ret = handler.initConfig.call(self, options);

				if (ret instanceof Promise)
				{
					ret.catch(function(err)
						{
							// 忽略initConfig的错误
							debug('initConfig <%s> err:%o', handler.name, err);
						});
				}

				return ret;
			}
		});

		self.clients = self.clients
			.then(function()
			{
				return Promise.all(running)
					.then(function()
					{
						return self._clients;
					});
			});

		return self.clients;
	},
	// 标准输入参数
	run: function(methodKey, query, body, callback, runOptions)
	{
		var self = this;
		if (typeof callback != 'function')
		{
			runOptions = callback;
			callback = null;
		}
		else if (domain.active)
		{
			callback = domain.active.bind(callback);
		}

		return self.clients.then(function(list)
			{
				var arr = methodKey.split('.');
				var client = list[arr.shift()];
				var methodName = arr.join('.');
				var retPromise;

				if (client)
				{
					var args =
					{
						methodKey	: methodKey,
						methodName	: methodName,
						query		: query,
						body		: body,
						runOptions	: runOptions,
						timing		:
						{
							navigationStart: Date.now()
						}
					};

					retPromise = client.run(args);
				}
				else
				{
					retPromise = Promise.reject('CLIENTLINKER:NO CLIENT,'+methodKey);
				}

				// 兼容callback
				if (callback)
				{
					retPromise.then(function(data)
					{
						callback(null, data);
					},
					function(ret)
					{
						callback(ret);
					});
				}

				return retPromise;
			});
	}
};


exports.Client = Client;
function Client(name, linker, options)
{
	this.name = name;
	this.linker = linker;
	this.options = options || {};
}

Client.prototype = {
	run: function(args)
	{
		var self = this;
		var flowList = self.options.flows;
		if (!flowList || !flowList.length) return Promise.reject('CLIENTLINKER:CLIENT NO FLOWS,'+self.name);

		args.client = this;
		return self.runFlows_(flowList, args, 0);
	},
	runFlows_: function(flowList, args, flowIndex)
	{
		var self = this;
		var timing = args.timing;
		var flow, flowEndCallback;
		for(; flow = flowList[flowIndex]; flowIndex++)
		{
			var type = typeof flow;
			if (type == 'string')
			{
				flow = self.linker.flows[flow];
				type = typeof flow;
			}
			
			if (type == 'function') break;
		}

		if (!flow) return Promise.reject('CLIENTLINKER:CLIENT FLOW OUT,'+self.name+'.'+args.methodName+','+flowList.length);

		debug('run %s.%s flow:%s(%d/%d)', self.name, args.methodName, flow.name, flowIndex+1, flowList.length);
		timing.lastFlowStart = Date.now();

		if (!timing.flowsStart)
		{
			timing.flowsStart = timing.lastFlowStart;
			flowEndCallback = function()
			{
				timing.lastFlowEnd = timing.flowsEnd = Date.now();
			};
		}
		else
		{
			flowEndCallback = function()
			{
				timing.lastFlowEnd = Date.now();
			};
		}

		// 伪装一下defer
		var defer = Promise.defer();
		var callback = function(ret, data)
		{
			ret ? defer.reject(ret) : defer.resolve(data);
		};
		var next = function(async)
		{
			var promise = self.runFlows_(flowList, args, ++flowIndex);
			if (!async) promise.then(defer.resolve, defer.reject);

			return promise;
		};
		callback.next = next;
		callback.promise = defer.promise;
		callback.resolve = defer.resolve;
		callback.reject = defer.reject;

		flow.call(this, args, callback);

		defer.promise.then(flowEndCallback, flowEndCallback);
		return defer.promise;
	}
};



