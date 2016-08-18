"use strict";

var Promise				= require('bluebird');
var expect				= require('expect.js');
var ClientLinker		= require('../');
var runClientHandler	= require('./runClientHandler');

describe('flows', function()
{
	it('localfile', function()
	{
		var linker = ClientLinker(
			{
				flows: ['localfile'],
				localfileDir: __dirname+'/localfile'
			});

		var promise1 = linker.run('client.js')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.be('local file errmsg')
				});

		var promise2 = linker.run('client.json')
			.then(function(data)
			{
				expect(data.string).to.be('string');
			});

		var promise3 = linker.methods()
			.then(function(list)
			{
				expect(list.client).to.be.an('object');
				var methods = Object.keys(list.client.methods);
				expect(methods).to.eql(['js','json']);
				expect(list.client.methods.js[0].handler).to.be.an('function');
			});

		return Promise.all([promise1, promise2, promise3]);
	});



	it('confighandler', function()
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clients: {
					client: {
						confighandler: require('./pkghandler/client')
					}
				}
			});

		var promise1 = runClientHandler(linker);
		var promise2 = linker.methods()
				.then(function(list)
				{
					expect(list.client).to.be.an('object');
					var methods = Object.keys(list.client.methods);
					expect(methods).to.eql(['method1', 'method2', 'method3', 'method4']);
					expect(list.client.methods.method1[0].handler).to.be.an('function');
				});

		return Promise.all([promise1, promise2]);
	});


	it('pkghandler', function()
	{
		var linker = ClientLinker(
			{
				flows: ['pkghandler'],
				pkghandlerDir: __dirname+'/pkghandler'
			});

		var promise1 = runClientHandler(linker);
		var promise2 = linker.methods()
				.then(function(list)
				{
					expect(list.client).to.be.an('object');
					var methods = Object.keys(list.client.methods);
					expect(methods).to.eql(['method1', 'method2', 'method3', 'method4']);
					expect(list.client.methods.method1[0].handler).to.be.an('function');
				});

		return Promise.all([promise1, promise2]);
	});

	it('logger', function(done)
	{
		var logger = require('../flows/logger/logger');
		var linker = ClientLinker(
			{
				flows: ['logger', 'custom'],
				defaults: {
					logger: function(runtime, err, data)
					{
						var timing = runtime.timing;
						var lastFlowTiming = runtime.lastFlow().timing;

						logger.loggerHandler.apply(null, arguments);

						try {
							expect(lastFlowTiming.start).to.be.an('number');
							expect(lastFlowTiming.end).to.be.an('number');
							expect(timing.flowsStart).to.be.an('number');
							expect(timing.flowsEnd).to.be.an('number');
							expect(err).to.be(null);
							expect(data.respone).to.be('respone');

							done();
						}
						catch(err)
						{
							done(err);
						}
					},
				},
				customFlows:
				{
					custom: function custom(runtime, callback)
					{
						callback(null, {respone: 'respone'});
					}
				},
				clients:
				{
					client: null
				}
			});

		linker.run('client.method', 123, {body:456}).catch(done);
	});



	it('debug', function()
	{
		var linker = ClientLinker(
			{
				flows: ['debug'],
				clients:
				{
					client: null
				}
			});

		return linker.run('client.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be.an(Error);
					expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
					expect(err.__runtime__).to.be.an('object');
					expect(err.__runtime__.navigationStart).to.be.a('number');
				});
	});
});
