'use strict';

var _		= require('lodash');
var Promise	= require('bluebird');
var debug	= require('debug')('clientlinker:flow');

exports.Flow = Flow;

function Flow(name)
{
	this.name = name;
	this._handler = null;
	this._methods = null;
}

_.extend(Flow.prototype,
{
	run: function(runtime, callback)
	{
		if (this._handler)
		{
			return this._handler.apply(this, arguments);
		}
		else
		{
			debug('skip by no handler: %s', this.name);
			return callback.next();
		}
	},
	methods: function()
	{
		if (this._methods)
		{
			return this._methods.apply(this, arguments);
		}
		else
		{
			debug('skip by no handler: %s', this.name);
			return Promise.resolve([]);
		}
	},
	register: function(name, handler)
	{
		var nameType = typeof name;
		if (nameType == 'function')
		{
			handler = name;
			name = 'process';
		}
		else if (nameType != 'string')
		{
			throw new Error('CLIENTLINKER:FlowRegisterNameMustBeString/Function');
		}
		else if (typeof handler != 'function')
		{
			handler = null;
		}

		debug('register, name:%s, handler:%s', name, handler);

		switch(name)
		{
			case 'methods':
				this._methods = handler;
				break;

			case 'process':
				this._handler = handler;
				break;

			default:
				debug('undefined name:%s', name);
		}
	},

});
