'use strict';

var Promise				= require('bluebird');
var expect				= require('expect.js');
var clientlinker		= require('clientlinker');


describe('#debugger', function()
{
	var linker = clientlinker(
	{
		flows: ['debugger', 'confighandler'],
		clients:
		{
			client1:
			{
				confighandler:
				{
					method1: function()
					{
						return Promise.resolve({string: 'string1'});
					}
				}
			},
			client2:
			{
				debuggerRuntime: true,
				confighandler:
				{
					method1: function()
					{
						return Promise.resolve({string: 'string1'});
					}
				}
			}
		}
	});

	linker.flow('debugger', require('../'));
	linker.flow('confighandler', require('clientlinker-flow-confighandler'));

	it('#run', function()
	{
		var promise1 = linker.run('client1.method')
			.then(function(){expect().fail()},
				function(err)
				{
					var runtime = err.__runtime__;
					expect(err).to.be.an(Error);
					expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
					expect(runtime).to.be.an('object');
					expect(runtime.navigationStart).to.be.a('number');
				});

		var promise2 = linker.run('client1.method1')
			.then(function(data)
			{
				var runtime = data.__runtime__;
				expect(data.string).to.be('string1');
				expect(runtime).to.be.an('object');
				expect(runtime.navigationStart).to.be.a('number');
			});

		return Promise.all([promise1, promise2]);
	});

	it('#runtime', function()
	{
		var promise1 = linker.run('client2.method')
			.then(function(){expect().fail()},
				function(runtime)
				{
					var err = runtime.originalReturn;
					expect(err).to.be.an(Error);
					expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
					expect(runtime).to.be.an('object');
					expect(runtime.navigationStart).to.be.a('number');
				});

		var promise2 = linker.run('client2.method1')
			.then(function(runtime)
			{
				var data = runtime.originalReturn;
				expect(data.string).to.be('string1');
				expect(runtime).to.be.an('object');
				expect(runtime.navigationStart).to.be.a('number');
			});

		return Promise.all([promise1, promise2]);
	});
});
