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
					var runtime =
					{
						methodKey	: methodKey,
						methodName	: methodName,
						query		: query,
						body		: body,
						runOptions	: runOptions,
						promise		: null,
						timing		:
						{
							navigationStart: Date.now()
						}
					};

					retPromise = client.run(runtime);
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
	run: function(runtime)
	{
		var self = this;
		var flowList = self.options.flows;
		if (!flowList || !flowList.length) return Promise.reject('CLIENTLINKER:CLIENT NO FLOWS,'+self.name);

		runtime.client = this;
		return self.runFlows_(flowList, runtime, 0);
	},
	runFlows_: function(flowList, runtime, flowIndex)
	{
		var self = this;
		var timing = runtime.timing;
		var inited = flowIndex == 0;
		var flow;
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

		if (!flow) return Promise.reject('CLIENTLINKER:CLIENT FLOW OUT,'+self.name+'.'+runtime.methodName+','+flowList.length);

		debug('run %s.%s flow:%s(%d/%d)', self.name, runtime.methodName, flow.name, flowIndex+1, flowList.length);
		
		var defer = Promise.defer();
		var timeEnd = function()
		{
			var endTime = timing.lastFlowEnd = Date.now();
			timing['flowEnd_'+flow.name] = startTime;
			if (inited) timing.flowsEnd = endTime;
		};
		var promise = defer.promise
				.then(function(data)
				{
					timeEnd();
					return data;
				},
				function(err)
				{
					timeEnd();
					throw err;
				});
		var callback = function(ret, data)
		{
			ret ? defer.reject(ret) : defer.resolve(data);
		};
		var next = function(async)
		{
			var promise = self.runFlows_(flowList, runtime, ++flowIndex);
			if (!async) promise.then(defer.resolve, defer.reject);

			return promise;
		};
		callback.next = next;
		callback.promise = promise;
		callback.resolve = defer.resolve;
		callback.reject = defer.reject;

		var startTime = timing.lastFlowStart = Date.now();
		timing['flowStart_'+flow.name] = startTime;
		if (inited)
		{
			timing.flowsStart = startTime;
			runtime.promise = promise;
		}

		flow.call(this, runtime, callback);
		return promise;
	}
};
