'use strict';

var deprecate	= require('depd')('clientlinker:flow');
var debug		= require('debug')('clientlinker:flow-dep');

exports.proto = function(Flow)
{
	var proto = Flow.prototype;

	proto.register = deprecate.function(function(registerName, handler)
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
					this.methods = handler;
					break;

				case 'process':
					this.run = handler;
					break;

				default:
					debug('undefined registerName:%s', registerName);
			}
		},
		'`flow.register` is will remove');
};
