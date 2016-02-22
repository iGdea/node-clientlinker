var _		= require('underscore');
var debug	= require('debug')('client_linker:main');

var DEFAULT_ERRMSG = exports.DEFAULT_ERRMSG = 'CLIENT_LINKER_DEFERT_ERROR';

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
		{
			_.extend(client.options, options);
			debug('update client options:%s', clientName);
		}
		else
		{
			client = this._clients[clientName] = new Client(clientName, this, options);
			debug('add client:%s', clientName);
		}

		return client;
	},
	bind: function(flowName, handler)
	{
		if (typeof handler == 'function')
		{
			debug('bind flow handler:%s', flowName);
			this.flows[flowName] = handler;
		}
		else
			debug('flow handler is not function:%s,%o', flowName, handler);
	},
	initConfig: function(options)
	{
		var self = this;
		var promises = _.map(self.flows, function(handler)
		{
			if (typeof handler.initConfig == 'function')
			{
				var ret = handler.initConfig.call(self, options);
				debug('run flow initConfig:%s', handler.name);

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
				return Promise.all(promises)
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
						methodKey		: methodKey,
						methodName		: methodName,
						query			: query,
						body			: body,
						runOptions		: runOptions,
						client			: client,
						promise			: null,
						timing			:
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
						// 增加process.nextTick，防止error被promise捕捉到
						process.nextTick(function()
						{
							callback(null, data);
						});
					},
					function(ret)
					{
						process.nextTick(function()
						{
							callback(ret || DEFAULT_ERRMSG);
						});
					});
				}

				return retPromise;
			});
	},
	// 罗列methods
	methods: function()
	{
		return this.clients
			.then(function(list)
			{
				var promises = _.map(list, function(client)
					{
						return client.methods()
								.then(function(methodList)
								{
									return {
										client: client,
										methods: methodList
									};
								});
					});

				return Promise.all(promises);
			})
			// 整理
			.then(function(list)
			{
				var map = {};
				list.forEach(function(item)
				{
					map[item.client.name] = item;
				});
				return map;
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
		var clientFlows = self.options.flows;
		if (!clientFlows || !clientFlows.length) return Promise.reject('CLIENTLINKER:CLIENT NO FLOWS,'+self.name);

		return self.runFlows_(new FlowRun(runtime));
	},
	runFlows_: function(flowRun)
	{
		var self = this;
		var runtime = flowRun.runtime;
		var timing = runtime.timing;
		var clientFlows = self.options.flows;
		var flow = flowRun.next();

		if (!flow) return Promise.reject('CLIENTLINKER:CLIENT FLOW OUT,'+self.name+'.'+runtime.methodName+','+clientFlows.length);

		debug('run %s.%s flow:%s(%d/%d)', self.name, runtime.methodName, flow.name, flowRun.flowIndex+1, clientFlows.length);
		
		var callback = flowRun.callbackDefer();
		var startTime = timing.lastFlowStart = Date.now();
		timing['flowStart_'+flow.name] = startTime;
		if (flowRun.inited)
		{
			timing.flowsStart = startTime;
			runtime.promise = callback.promise;
		}

		try {
			var ret = flow.call(this, runtime, callback);
			if (ret instanceof Promise) ret.catch(callback.reject);
		}
		catch(err)
		{
			callback.reject(err);
		}

		return callback.promise;
	},

	methods: function()
	{
		var self = this;
		var clientFlows = self.options.flows;
		var linkerFlows = self.linker.flows;

		if (!clientFlows) return Promise.resolve([]);

		var promises = clientFlows.map(function(handler)
			{
				if (typeof handler == 'string')
					handler = linkerFlows[handler];
				
				if (handler && typeof handler.methods == 'function')
				{
					var list = handler.methods(self);
					if (list instanceof Promise)
					{
						return list.then(function(list)
							{
								if (list)
								{
									return {
										flow: handler,
										methods: list
									};
								}
							},
							// 屏蔽错误
							function(err)
							{
								debug('read methods err,flow:%s err:%o', handler.name, err);
							});
					}
					else if (list)
					{
						return {
							flow: handler,
							methods: list
						}
					}
				}
			});

		return Promise.all(promises)
			.then(function(methodList)
			{
				var list = {};
				methodList.forEach(function(item)
				{
					if (!item) return;
					item.methods.forEach(function(methodName)
					{
						var methodInfo = list[methodName] || (list[methodName] = []);
						methodInfo.push(item.flow);
					});
				});

				return list;
			});
	},
};


exports.FlowRun = FlowRun;
function FlowRun(runtime)
{
	this.runtime = runtime;
	this.flowIndex = -1;
	this.inited = true;
	this.currentFlow = null;
}

FlowRun.prototype = {
	anyToError: function(originalError)
	{
		var errType = typeof originalError;
		var err;

		if (originalError && errType == 'object')
		{
			err = new Error(originalError.message || 'ERROR');
			_.extend(err, originalError);
		}
		else if (errType == 'number')
		{
			err = new Error('client,'+this.runtime.methodKey+','+originalError);
			err.code = err.errCode = originalError;
		}
		else
		{
			err = new Error(originalError || DEFAULT_ERRMSG);
		}

		err.isClientNewError = true;
		err.originalError = originalError;
		return err;
	},
	next: function()
	{
		var flow;
		var client = this.runtime.client;
		this.inited = this.flowIndex == -1;
		this.flowIndex++;

		for(var linkerFlows = client.linker.flows,
			clientFlows = client.options.flows;
			flow = clientFlows[this.flowIndex];
			this.flowIndex++)
		{
			var type = typeof flow;
			if (type == 'string')
			{
				flow = linkerFlows[flow];
				type = typeof flow;
			}
			
			if (type == 'function') break;
		}

		this.currentFlow = flow;

		return flow;
	},
	// 注意：要保持当前的状态
	// 中间有异步的逻辑，可能导致状态改变
	callbackDefer: function()
	{
		var self	= this;
		var client	= self.runtime.client;
		var flow	= self.currentFlow;
		var inited	= self.inited;

		var resolve, reject;
		var promise = new Promise(function(resolve0, reject0)
				{
					resolve = resolve0;
					reject = reject0;
				})
				.then(function(data)
				{
					self.timeEnd(flow, inited);
					return data;
				},
				function(err)
				{
					self.timeEnd(flow, inited);

					// 将错误信息转化为Error对象
					if (client.options.anyToError && !(err instanceof Error))
					{
						err = self.anyToError(err);
					}

					// 方便定位问题
					if (err && typeof err == 'object')
					{
						err.fromClient || (err.fromClient = self.runtime.client.name);
						err.fromClientFlow || (err.fromClientFlow = flow.name);
					}

					throw err;
				});

		function callback(ret, data)
		{
			ret ? callback.reject(ret) : callback.resolve(data);
		}

		function next(async)
		{
			var promise = client.runFlows_(self);
			if (!async) promise.then(callback.resolve, callback.reject);
			return promise;
		}

		callback.promise	= promise;
		callback.resolve	= resolve;
		callback.reject		= reject;
		callback.next		= next;

		return callback;
	},
	timeEnd: function(flow, inited)
	{
		var timing = this.runtime.timing;
		var endTime = timing.lastFlowEnd = Date.now();
		timing['flowEnd_'+flow.name] = endTime;
		if (inited) timing.flowsEnd = endTime;
	}
};
