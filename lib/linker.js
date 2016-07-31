"use strict";

var Promise		= require('bluebird');
var _			= require('underscore');
var debug		= require('debug')('client_linker:linker');
var isPromise	= require('is-promise');
var Client		= require('./client').Client;
var Flow		= require('./flow').Flow;
var Runtime		= require('./runtime').Runtime;

var DEFAULT_ERRMSG = exports.DEFAULT_ERRMSG = 'CLIENT_LINKER_DEFERT_ERROR';

exports.Linker = Linker;
function Linker(options)
{
	this._clients = {};
	this._clientPromise = Promise.resolve(this._clients);
	this.flows = {};
	// 包含初始化client的一些配置
	this.options = options || {};
}

Linker.prototype = {
	JSON: require('./json'),

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
			// addclientDefaultOptions
			options || (options = {});
			options = _.extend({}, this.options.clientDefaultOptions,
				!options.flows && this.options.clientDefaultOptions && this.options.clientDefaultOptions.flows
				&& {flows: this.options.clientDefaultOptions.flows.slice()},
				options);

			client = this._clients[clientName] = new Client(clientName, this, options);
			debug('add client:%s', clientName);
		}
	},


	loadFlow: function(name, pkgpath, module)
	{
		if (!pkgpath) pkgpath = name;
		var pkg = module ? module.require(pkgpath) : require(pkgpath);

		var result = this._bindFlow(name, pkg);
		this.initConfig(null, [pkg]);

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
					ret.catch(function(err)
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
	run: function(methodKey, query, body, callback, options)
	{
		var self = this;

		if (typeof callback != 'function')
		{
			if (callback && arguments.length < 5)
			{
				options = callback;
			}

			callback = null;
		}

		return self.parseMethodKey(methodKey)
			.then(function(data)
			{
				var retPromise;

				if (data.client)
				{
					var runtime = new Runtime(data.client, methodKey, data.method,
						query, body, options);

					retPromise = data.client.run(runtime);
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
	// 解析methodKey
	parseMethodKey: function(methodKey)
	{
		return this.clients()
			.then(function(list)
			{
				var arr = methodKey.split('.');
				var client = list[arr.shift()];
				var method = arr.join('.');

				return {
					client		: client,
					method	: method
				};
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
	},
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

		err.isClientLinkerNewError = true;
		err.originalError = originalError;
		return err;
	}
};
