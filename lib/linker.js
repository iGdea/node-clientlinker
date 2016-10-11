"use strict";

var Promise		= require('bluebird');
var _			= require('underscore');
var debug		= require('debug')('clientlinker:linker');
var deprecate	= require('depd')('clientlinker:linker');
var isPromise	= require('is-promise');
var Client		= require('./client').Client;
var Flow		= require('./flow').Flow;
var Runtime		= require('./runtime').Runtime;
var Module		= require('module').Module;
var STATIC		= require('./static');


exports.Linker = Linker;
function Linker(options)
{
	this._clients = {};
	this._clientPromise = Promise.resolve(this._clients);
	this.flows = {};
	// 包含初始化client的一些配置
	this.options = options || {};

	if (this.options.clientDefaultOptions)
	{
		deprecate('use `defaults` instead of `clientDefaultOptions`');
		this.options.defaults = this.options.clientDefaultOptions;

		Object.defineProperty(this.options, 'clientDefaultOptions',
			{
				configurable: true,
				get: function() {return this.defaults},
				set: function(val) {this.defaults = val}
			});

		deprecate.property(this.options, 'clientDefaultOptions',
				'use `defaults` instead of `clientDefaultOptions`');
	}
}

var proto = Linker.prototype =
{
	actionCache: {},
	JSON: STATIC.JSON,
	anyToError: STATIC.anyToError,

	addClient: function(clientName, options, notOverride)
	{
		var self = this;
		if (typeof clientName == 'object')
		{
			notOverride = options;
			_.each(clientName, function(options, name)
			{
				self._addClient(name, options, notOverride);
			});
		}
		else
		{
			self._addClient(clientName, options, notOverride);
		}

		this.actionCache = {};
	},
	_addClient: function(clientName, options, notOverride)
	{
		var client = this._clients[clientName];

		if (client)
		{
			if (notOverride === true)
				_.defaults(client.options, options);
			else
				_.extend(client.options, options);

			debug('update client options:%s override:%s', clientName, notOverride);
		}
		else
		{
			options || (options = {});

			var defaultFlowOptions = !options.flows
				&& this.options.defaults
				&& this.options.defaults.flows
				&& {flows: this.options.defaults.flows.slice()};

			options = _.extend({}, this.options.defaults,
				defaultFlowOptions, options);

			client = this._clients[clientName] = new Client(clientName, this, options);
			debug('add client:%s', clientName);
		}
	},

	loadFlow: function(pkgpath, module)
	{
		var self = this;
		if (pkgpath instanceof Module)
		{
			return self._genLoadHandler(pkgpath);
		}
		else if (typeof module == 'string')
		{
			deprecate('`linker.loadFlow` not support `name` yet.');
			return self._loadFlow(module, arguments[2], pkgpath, true);
		}
		else
		{
			return self._loadFlow(pkgpath, module, null, true);
		}
	},
	_genLoadHandler: function(module)
	{
		var self = this;
		return function loadFlow(pkgpath)
			{
				return self._loadFlow(pkgpath, module, null, true);
			};
	},
	_loadFlow: function(pkgpath, module, name, initConfig)
	{
		var pkg = module ? module.require(pkgpath) : require(pkgpath);
		var handler = pkg.handler || pkg;
		if (!name) name = pkg.name || handler.name;

		var result = this._bindFlow(name, handler);
		if (initConfig) this.initConfig(null, [handler]);

		return result;
	},
	// 注册flower
	bindFlow: function(flowName, handler)
	{
		var self = this;
		if (typeof flowName == 'object')
		{
			_.each(flowName, function(handler, name)
			{
				self._bindFlow(name, handler);
			});
		}
		else
		{
			self._bindFlow(flowName, handler);
		}
	},
	_bindFlow: function(flowName, handler)
	{
		if (typeof handler == 'function')
		{
			debug('bind flow handler:%s', flowName);
			this.flows[flowName] = new Flow(flowName, handler);

			return true;
		}
		else
		{
			debug('flow handler is not function:%s,%o', flowName, handler);
			return false;
		}
	},

	getFlow: function(name)
	{
		if (this.flows[name]) return this.flows[name];
		if (STATIC.sysflows[name])
		{
			this._loadFlow('../flows/'+name+'/'+name, module, name, false);
			return this.flows[name];
		}
	},

	// 通过配置文件来获取更多的client
	// 例如通过path获取
	initConfig: function(options, flows)
	{
		var self = this;
		options = _.extend({}, self.options, options);

		var promises = _.map(flows || self.flows, function(handler)
		{
			if (typeof handler.initConfig == 'function')
			{
				var ret = handler.initConfig.call(self, options, self);
				debug('run flow initConfig:%s', handler.name);

				if (isPromise(ret))
				{
					ret = ret.catch(function(err)
						{
							// 忽略initConfig的错误
							debug('initConfig <%s> err:%o', handler.name, err);
						});
				}

				return ret;
			}
		});

		self._clientPromise = self._clientPromise
			.then(function()
			{
				return Promise.all(promises)
					.then(function()
					{
						return self._clients;
					});
			});
	},
	// 标准输入参数
	run: function(action, query, body, callback, options)
	{
		return this.runIn(arguments, 'run');
	},

	runInShell: function()
	{
		return this.runIn(arguments, 'shell');
	},

	runIn: function(args, source, env)
	{
		var self = this;
		var callback = args[3];
		var options = args[4];
		// var domain = process.domain;

		if (typeof callback != 'function')
		{
			if (callback && args.length < 5)
			{
				options = callback;
			}

			callback = null;
		}

		var doneHandler = function(runtime)
		{
			retPromise.runtime = runtime;

			if (env) _.extend(runtime.env, env);
			runtime.env.source = source;
			return self._runByRuntime(runtime, callback);
		}
		var failHanlder;

		// if (domain)
		// {
		// 	doneHandler = domain.bind(doneHandler);
		// 	failHanlder = domain.bind(function(err){throw err});
		// }

		// 讲runtime通过retPromise暴露出去
		var runtimePromise = self._newRuntime(args[0], args[1], args[2], options);
		var retPromise = runtimePromise
			.then(doneHandler, failHanlder);

		retPromise.runtimePromise = runtimePromise;

		return retPromise;
	},

	_runByRuntime: function(runtime, callback)
	{
		var self = this;
		var retPromise = runtime.client.run(runtime);

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
					callback(ret || STATIC.DEFAULT_ERROR);
				});
			});
		}

		return retPromise;
	},

	_newRuntime: function(action, query, body, options)
	{
		var self = this;

		return self.parseAction(action)
			.then(function(data)
			{
				if (data.client)
				{
					return new Runtime(data.client, action, data.method,
						query, body, options);
				}
				else
				{
					var err = new Error('CLIENTLINKER:NO CLIENT,'+action);
					err.CLIENTLINKER_TYPE = 'NO CLIENT';
					err.CLIENTLINKER_ACTION = action;
					throw err;
				}
			});
	},

	// 解析action
	parseAction: function(action)
	{
		var self = this;
		var actionInfo = self.actionCache[action];
		if (actionInfo) return actionInfo;

		return this.clients()
			.then(function(list)
			{
				var arr = action.split('.');
				var client = list[arr.shift()];
				var method = arr.join('.');

				actionInfo = Promise.resolve(
					{
						client	: client,
						method	: method
					});

				self.actionCache[action] = actionInfo;

				return actionInfo;
			});
	},

	// 罗列methods
	methods: function()
	{
		return this._clientPromise
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
	},

	clients: function()
	{
		var self = this;
		var clientPromise = self._clientPromise;

		return clientPromise.then(function(list)
			{
				if (self._clientPromise === clientPromise)
					return list;
				else
					return self.clients();
			});
	}
};




proto.add = deprecate.function(proto.addClient,
	'use `linker.addClient` instead of `linker.add`');
proto.parseMethodKey = deprecate.function(proto.parseAction,
	'use `linker.parseAction` instead of  `linker.parseMethodKey`');

proto.runByKey = deprecate.function(function runByKey(key)
	{
		var action = key.replace(':', '.');

		if (action != key)
		{
			deprecate('run key use ":", please use "." instead');
			arguments[0] = action;
		}

		this.run.apply(this, arguments);
	},
	'use `linker.run` instead of `linker.runByKey`');

proto.proxyRoute = deprecate.function(function proxyRoute()
	{
		return require('../flows/httpproxy/route')(this);
	},
	'use `require("clientlinker/flows/httpproxy/route")(linker)`'
		+ ' instead of `linker.proxyRoute`');
