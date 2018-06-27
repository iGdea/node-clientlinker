'use strict';

var ClientLinker = require('../../');

var linker = ClientLinker(
	{
		flows: ['nextFlow', 'localfile', 'confighandler', 'pkghandler'],
		localfileDir: __dirname+'/../localfile',
		clients: {
			client_conf: {
				confighandler: require('../pkghandler/client_its')
			},
			client_its:
			{
				pkghandler: __dirname+'/../pkghandler/client_its'
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

exports = module.exports = linker;
