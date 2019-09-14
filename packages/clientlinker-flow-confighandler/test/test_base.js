'use strict';

var expect				= require('expect.js');
var clientlinker		= require('clientlinker');
var confighandlerTest	= require('clientlinker-flow-confighandler-test');

describe('#confighandler', function()
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

	linker.flow('confighandler', require('../'));

	confighandlerTest.run(linker, 'client');

	it('#methods', function()
	{
		return linker.methods()
			.then(function(map)
			{
				expect(map.client).to.be.an('object');
				var methods = Object.keys(map.client.methods);
				expect(methods).to.eql(
				[
					'method',
					'method_params',
					'method_promise_resolve',
					'method_promise_reject_number',
					'method_promise_reject_error',
					'method_callback_data',
					'method_callback_error_number',
					'method_callback_error_error'
				]);
			});
	});
});
