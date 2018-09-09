'use strict';

var _			= require('lodash');
var Promise		= require('bluebird');
var debug		= require('debug')('clientlinker:linker');
var Client		= require('./client').Client;
var Flow		= require('./flow').Flow;
var Runtime		= require('./runtime/client_runtime').ClientRuntime;
var STATIC		= require('./static');
var depLinker	= require('./deps/dep_linker');


exports.Linker = Linker;
function Linker(options)
{
	this._clients = {};
	this._initProcessPromise = Promise.resolve();
	this.flows = {};
	// 包含初始化client的一些配置
	this.options = options || {};
	// 用来暴露最近一次执行runIn时，返回的runtime对象
	this.lastRuntime = null;

	depLinker.init.call(this);
}

var proto = Linker.prototype;
_.extend(proto,
{
	JSON		: STATIC.JSON,
	version		: require('../package.json').version,
	anyToError	: STATIC.anyToError,

	client: function(clientName, options)
	{
		if (typeof clientName != 'string')
		{
			throw new Error('CLIENTLINKER:ClientNameMustBeString,'+ clientName);
		}
		if (arguments.length == 1)
		{
			debug('get client instead of set');
			return this._clients[clientName];
		}
		if (typeof options != 'object')
		{
			throw new Error('CLIENTLINKER:ClientOptionsMustBeObject,'+ clientName);
		}

		var defaultFlowOptions = options
			&& !options.flows
			&& this.options.defaults
			&& this.options.defaults.flows
			&& {flows: this.options.defaults.flows.slice()};

		options = _.extend({}, this.options.defaults,
			defaultFlowOptions, options);

		var client = this._clients[clientName] = new Client(clientName, this, options);
		debug('add client:%s', clientName);

		return client;
	},

	// 注册flower
	flow: function(flowName, handler)
	{
		if (typeof flowName != 'string')
		{
			throw new Error('CLIENTLINKER:FlowNameMustBeString,'+ flowName);
		}
		else if (arguments.length == 1)
		{
			debug('get client instead of set');
			return this.flows[flowName];
		}
		else if (typeof handler != 'function')
		{
			throw new Error('CLIENTLINKER:FlowHandlerMustBeFunciton,'+ flowName);
		}

		var flow = new Flow(flowName);
		handler(flow, this);
		this.flows[flowName] = flow;
	},

	onInit: function(checkHandler)
	{
		var self = this;
		self._initProcessPromise = Promise.all(
			[
				self._initProcessPromise,
				checkHandler(self)
			]);
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
		var action = args[0];
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

		// if (domain)
		// {
		// 	doneHandler = domain.bind(doneHandler);
		// 	failHanlder = domain.bind(function(err){throw err});
		// }
		var runtime = new Runtime(self, action, args[1], args[2], options)

		// 通过这种手段，同步情况下，暴露runtime
		// runtime保存着运行时的所有数据，方便进行调试
		self.lastRuntime = runtime;

		return this.parseAction(action)
			.then(function(data)
			{
				runtime.method = data.method;

				if (!data.client)
				{
					var err = new Error('CLIENTLINKER:NotFound,'+action);
					err.CLIENTLINKER_TYPE = 'NO CLIENT';
					err.CLIENTLINKER_ACTION = action;
					throw err;
				}

				runtime.client = data.client;
				runtime.env.source = source;

				if (env) _.extend(runtime.env, env);
				return self._runByRuntime(runtime, callback);
			});
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

	// 解析action
	parseAction: function(action)
	{
		return this.clients()
			.then(function(list)
			{
				var info = STATIC.parseAction(action);

				return {
					client	: list[info.clientName],
					method	: info.method
				};
			});
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
});


depLinker.proto(Linker);
