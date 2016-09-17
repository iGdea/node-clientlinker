"use strict";

var ClientLinker = require('../../');

var linker = ClientLinker(
	{
		flows: ['nextFlow', 'localfile', 'confighandler', 'pkghandler'],
		localfileDir: __dirname+'/../localfile',
		pkghandlerDir: __dirname+'/../pkghandler',
		clients: {
			client_conf: {
				confighandler: require('../pkghandler/client_its')
			}
		},
		customFlows:
		{
			nextFlow: function nextFlow(runtime, callback)
			{
				callback.next();
			},
			custom: function custom(runtime, callback)
			{
				callback(null, {respone: 'respone'});
			}
		}
	});

exports = module.exports = linker;
