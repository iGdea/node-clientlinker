'use strict';

var _			= require('lodash');
var Module		= require('module').Module;
var deprecate	= require('depd')('clientlinker:linker');


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

			this.run.apply(this, arguments);
		},
		'use `linker.run` instead of `linker.runByKey`');

	proto.bindFlow = deprecate.function(function(name, handler)
		{
			var self = this;
			function bindFlow(handler, name)
			{
				if (typeof handler.init == 'function')
				{
					var ret = handler.init(self);
					if (ret === false) return false;
				}
				self.onInit(function(){return ret});
				self.flow(name, function(flow)
				{
					flow.register(handler);
					if (handler.methods)
					{
						flow.register('methods', handler.methods);
					}
				});
				return true;
			}

			if (typeof name == 'object')
				_.each(name, bindFlow);
			else
				bindFlow(handler, name);
		},
		'use `linker.flow` instead of `linker.bindFlow`');

	proto.loadFlow = deprecate.function(function(pkgpath, module)
		{
			var self = this;
			function loadFlow(pkghandler, module, name)
			{
				var handler = module ? module.require(pkghandler) : require(pkghandler);
				return self.bindFlow(name, handler);
			}

			if (typeof module == 'string')
				return loadFlow(pkgpath, arguments[2], module);
			else if (pkgpath instanceof Module)
			{
				module = pkgpath;
				return function(name, pkgpath)
				{
					if (!pkgpath) {pkgpath = name; name = null}
					return loadFlow(pkgpath, module, name);
				};
			}
			else
				return loadFlow(pkgpath, module);
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
