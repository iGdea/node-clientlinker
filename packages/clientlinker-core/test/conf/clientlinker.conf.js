'use strict';

var clientlinker = require('../../');

var linker = clientlinker(
	{
		flows: ['nextFlow', 'confighandler', 'pkghandler'],
		clients:
		{
			client_conf:
			{
				confighandler: require('clientlinker-flow-confighandler-test').methods
			},
			client_its:
			{
				pkghandler: 'clientlinker-flow-confighandler-test/lib/methods'
			}
		},
		customFlows:
		{
			nextFlow: function nextFlow(runtime, callback)
			{
				return callback.next();
			},
			custom: function custom(runtime, callback)
			{
				callback(null, {respone: 'respone'});
			}
		}
	});

linker.flow('pkghandler', require('clientlinker-flow-pkghandler'));
linker.flow('confighandler', require('clientlinker-flow-confighandler'));

exports = module.exports = linker;
