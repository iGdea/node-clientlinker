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
	register: function(registerName, handler)
	{
		var registerNameType = typeof registerName;
		if (registerNameType == 'function')
		{
			handler = registerName;
			registerName = 'process';
		}
		else if (registerNameType != 'string')
		{
			throw new Error('CLIENTLINKER:FlowRegisterNameMustBeString/Function');
		}
		else if (typeof handler != 'function')
		{
			handler = null;
		}

		debug('register flow, name: %s registerName:%s', this.name, registerName);

		switch(registerName)
		{
			case 'methods':
				this._methods = handler;
				break;

			case 'process':
				this._handler = handler;
				break;

			default:
				debug('undefined registerName:%s', registerName);
		}
	},

});
