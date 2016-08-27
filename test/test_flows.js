"use strict";

var Promise				= require('bluebird');
var expect				= require('expect.js');
var ClientLinker		= require('../');
var runClientHandler	= require('./pkghandler/lib/run');

describe('#flows', function()
{
	it('!localfile', function()
	{
		var linker = ClientLinker(
			{
				flows: ['localfile'],
				defaults:
				{
					opt: 'myOpt'
				},
				localfileDir: __dirname+'/localfile',
				clients:
				{
					client2:
					{
						localfile: __dirname+'/localfile/not_exsits'
					}
				}
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
			.then(function(map)
			{
				expect(map.client).to.be.an('object');
				expect(map.client.client.options.opt).to.be('myOpt');
				expect(map.client.client.options.localfile).to.contain(__dirname);
				expect(map.client2.client.options.localfile).to.contain('localfile/not_exsits');

				var methods = Object.keys(map.client.methods);
				expect(methods).to.eql(['js','json']);
				expect(map.client.methods.js[0].handler).to.be.an('function');
			});

		return Promise.all([promise1, promise2, promise3]);
	});



	it('!confighandler', function()
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
				.then(function(map)
				{
					expect(map.client).to.be.an('object');
					var methods = Object.keys(map.client.methods);
					expect(methods).to.eql(['method1', 'method2', 'method3', 'method4']);
					expect(map.client.methods.method1[0].handler).to.be.an('function');
				});

		return Promise.all([promise1, promise2]);
	});


	it('!pkghandler', function()
	{
		var linker = ClientLinker(
			{
				flows: ['pkghandler'],
				defaults:
				{
					opt: 'myOpt'
				},
				pkghandlerDir: __dirname+'/pkghandler',
				clients:
				{
					client2:
					{
						pkghandler: __dirname+'/pkghandler/not_exsits'
					}
				}
			});

		var promise1 = runClientHandler(linker);
		var promise2 = linker.methods()
			.then(function(map)
			{
				expect(map.client).to.be.an('object');
				expect(map.client.client.options.opt).to.be('myOpt');
				expect(map.client.client.options.pkghandler).to.contain(__dirname);
				expect(map.client2.client.options.pkghandler).to.contain('pkghandler/not_exsits');

				var methods = Object.keys(map.client.methods);
				expect(methods).to.eql(['method1', 'method2', 'method3', 'method4']);
				expect(map.client.methods.method1[0].handler).to.be.an('function');
			});

		return Promise.all([promise1, promise2]);
	});

	it('!logger', function(done)
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



	it('!debugger', function()
	{
		var linker = ClientLinker(
			{
				flows: ['debugger'],
				clients:
				{
					client1: null,
					client2:
					{
						debuggerRuntime: true
					}
				}
			});

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

		var promise2 = linker.run('client2.method')
			.then(function(){expect().fail()},
				function(runtime)
				{
					var err = runtime.originalReturn;
					expect(err).to.be.an(Error);
					expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
					expect(runtime).to.be.an('object');
					expect(runtime.navigationStart).to.be.a('number');
				});

		return Promise.all([promise1, promise2]);
	});
});
