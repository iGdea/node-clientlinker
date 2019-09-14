'use strict';

var clientlinker		= require('clientlinker');
var confighandlerTest	= require('../');

describe('#base', function()
{
	var linker = clientlinker(
	{
		flows: ['confighandler'],
		clients:
		{
			client:
			{
				confighandler: confighandlerTest.methods
			}
		}
	});

	linker.flow('confighandler', require('clientlinker-flow-confighandler'));
	confighandlerTest.run(linker, 'client');
});
