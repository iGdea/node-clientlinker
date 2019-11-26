'use strict';

var _			= require('lodash');
var Module		= require('module').Module;
var deprecate	= require('depd')('clientlinker:linker');
var debug		= require('debug')('clientlinker:linker-dep');


exports.init = function()
{
	if (this.options.clientDefaultOptions)
	{
		deprecate('use `defaults` instead of `clientDefaultOptions`');
		if (!this.options.defaults)
		{
			this.options.defaults = this.options.clientDefaultOptions;
		}

		Object.defineProperty(this.options, 'clientDefaultOptions',
			{
				configurable: true,
				get: function() {return this.defaults},
				set: function(val) {this.defaults = val}
			});

		deprecate.property(this.options, 'clientDefaultOptions',
				'use `defaults` instead of `clientDefaultOptions`');
	}
};


exports.proto = function(Linker)
{
	var proto = Linker.prototype;

	proto.add = deprecate.function(_addClient,
		'use `linker.client` instead of `linker.add`');
	proto.addClient = deprecate.function(_addClient,
		'use `linker.client` install of `linker.addClient`');
	proto.parseMethodKey = deprecate.function(proto.parseAction,
		'use `linker.parseAction` instead of  `linker.parseMethodKey`');

	proto.getFlow = deprecate.function(function(name)
		{
			return this.flow(name);
		},
		'use `linker.flow` instead of `linker.getFlow`');

	proto.runByKey = deprecate.function(function runByKey(key)
		{
			var action = key.replace(':', '.');

			if (action != key)
			{
				deprecate('run key use ":", please use "." instead');
				arguments[0] = action;
			}

			return this.run.apply(this, arguments);
		},
		'use `linker.run` instead of `linker.runByKey`');

	proto.bindFlow = deprecate.function(function(name, handler)
		{
			var self = this;
			function bindFlow(handler, name)
			{
				if (typeof handler != 'function') return false;
				if (typeof handler.init == 'function')
				{
					var ret = handler.init(self);
					if (ret === false) return false;
				}
				self.onInit(function(){return ret});
				try {
					self.flow(name, function(flow)
					{
						flow.run = function(runtime, callback)
						{
							return handler.call(this, runtime, callback.toFuncCallback());
						};

						if (handler.methods)
						{
							flow.methods = handler.methods;
						}
					});
				}
				catch(err)
				{
					debug('bindFlow err: %o', err);
					return false;
				}

				return true;
			}

			if (typeof name == 'object')
				_.each(name, bindFlow);
			else if (typeof name == 'function')
				return bindFlow(name, name.name);
			else
				return bindFlow(handler, name);
		},
		'use `linker.flow` instead of `linker.bindFlow`');

	proto.loadFlow = deprecate.function(function(name, pkgpath, module)
		{
			var self = this;
			function loadFlow(name, pkghandler, module)
			{
				if (!pkgpath)
				{
					pkgpath = name;
					name = null;
				}
				else if(pkghandler instanceof Module)
				{
					module = pkghandler;
					pkghandler = name;
					name = null;
				}

				debug('loadflow, file: %s, name: %s, module: %s', pkghandler, name, module);
				var handler = module ? module.require(pkghandler) : require(pkghandler);
				return self.bindFlow(name, handler);
			}

			if (name instanceof Module)
			{
				module = name;
				return function(name, pkgpath)
				{
					return loadFlow(name, pkgpath, module);
				};
			}
			else
				return loadFlow(name, pkgpath, module);
		},
		'use `linker.flow` instead of `linker.loadFlow`');
};



function _addClient(name, options)
{
	var self = this;
	function addClient(options, name)
	{
		self.client(name, options || {});
	}

	if (typeof name == 'object')
		_.each(name, addClient);
	else
		addClient(options, name);
}
