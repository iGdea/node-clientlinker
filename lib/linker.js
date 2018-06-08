"use strict";

var Promise		= require('bluebird');
var _			= require('lodash');
var debug		= require('debug')('clientlinker:linker');
var deprecate	= require('depd')('clientlinker:linker');
var Client		= require('./client').Client;
var Flow		= require('./flow').Flow;
var Runtime		= require('./runtime').Runtime;
var Module		= require('module').Module;
var STATIC		= require('./static');


exports.Linker = Linker;
function Linker(options)
{
	this._clients = {};
	this._initProcessPromise = Promise.resolve();
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
	JSON		: STATIC.JSON,
	version		: require('../package.json').version,
	anyToError	: STATIC.anyToError,
	actionCache	: {},

	addClient: function(clientName, options)
	{
		var self = this;
		self.actionCache = {};

		if (typeof clientName == 'object')
		{
			var result = {};
			_.each(clientName, function(options, name)
			{
				result[name] = self._addClient(name, options);
			});

			return result;
		}
		else
		{
			return self._addClient(clientName, options);
		}
	},
	_addClient: function(clientName, options)
	{
		var client = this._clients[clientName];

		if (client)
		{
			_.extend(client.options, options);
			debug('update client options:%s', clientName);
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

		return client;
	},

	loadFlow: function(pkgpath, module)
	{
		var self = this;

		if (STATIC.sysflows[pkgpath] && !module)
		{
			var p = self._getSysflowPath(pkgpath);
			return self._loadFlow(p, null, pkgpath);
		}
		else if (typeof module == 'string')
		{
			deprecate('`linker.loadFlow` not support `name` yet.');
			return self._loadFlow(module, arguments[2], pkgpath);
		}
		else if (pkgpath instanceof Module)
			return self._genLoadHandler(pkgpath);
		else
			return self._loadFlow(pkgpath, module, null);
	},
	_genLoadHandler: function(module)
	{
		var self = this;
		return function loadFlow(pkgpath)
			{
				if (STATIC.sysflows[pkgpath])
				{
					var p = self._getSysflowPath(pkgpath);
					return self._loadFlow(p, null, pkgpath);
				}

				return self._loadFlow(pkgpath, module, null);
			};
	},
	_loadFlow: function(pkgpath, module, name)
	{
		var pkg = module ? module.require(pkgpath) : require(pkgpath);
		var handler = pkg.handler || pkg;
		if (!name) name = pkg.name || handler.name;

		var result = this._registerFlow(name, handler);

		return result;
	},
	// 注册flower
	registerFlow: function(flowName, handler)
	{
		var self = this;
		if (typeof flowName == 'object')
		{
			_.each(flowName, function(handler, name)
			{
				self._registerFlow(name, handler);
			});
		}
		else
		{
			self._registerFlow(flowName, handler);
		}
	},
	_registerFlow: function(flowName, handler)
	{
		var self = this;

		if (typeof handler == 'function')
		{
			debug('bind flow handler:%s', flowName);
			var flow = new Flow(flowName, handler);

			if (typeof flow.init == 'function')
			{
				// 有一些同步的检查可以在这里被抛出来
				var promise = flow.init(self);
				if (promise === false)
				{
					debug('As `flow.init`, ignore flow:%s', flowName);
					return false;
				}
				self._addInitProcessWorkflow([promise]);
			}

			self.flows[flowName] = flow;
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
			var p = this._getSysflowPath(name);
			this._loadFlow(p, null, name);
			return this.flows[name];
		}
	},
	_getSysflowPath: function(name)
	{
		return '../flows/'+name+'/'+name;
	},

	_addInitProcessWorkflow: function(promises)
	{
		var self = this;
		promises.push(self._initProcessPromise);
		self._initProcessPromise = Promise.all(promises);
	},
	// 标准输入参数
	run: function(action, query, body, callback, options)
	{
		/* eslint no-unused-vars: off */
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
					var err = new Error('CLIENTLINKER:NotFound,'+action);
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

		actionInfo = self.actionCache[action] = this.clients()
			.then(function(list)
			{
				var info = STATIC.parseAction(action);

				return {
					client	: list[info.clientName],
					method	: info.method
				};
			});

		return actionInfo;
	},

	// 罗列methods
	methods: function()
	{
		return this.clients()
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
		var clientPromise = self._initProcessPromise;

		return clientPromise
			.then(function()
			{
				if (self._initProcessPromise === clientPromise)
					return self._clients;
				else
					return self.clients();
			});
	}
};




proto.add = deprecate.function(proto.addClient,
	'use `linker.addClient` instead of `linker.add`');
proto.bindFlow = deprecate.function(proto.registerFlow,
	'use `linker.registerFlow` instead of `linker.bindFlow`');
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
