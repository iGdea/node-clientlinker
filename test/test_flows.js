"use strict";

var Promise				= require('bluebird');
var expect				= require('expect.js');
var ClientLinker		= require('../');
var runClientHandlerIts	= require('./pkghandler/lib/run');

describe('#flows', function()
{
	it('#localfile', function()
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
				expect(map.client.client.options.localfile)
					.to.contain(__dirname);
				expect(map.client2.client.options.localfile)
					.to.contain('localfile/not_exsits');

				var methods = Object.keys(map.client.methods);
				expect(methods).to.eql(['js','json']);
				expect(map.client.methods.js[0].handler).to.be.an('function');
			});

		return Promise.all([promise1, promise2, promise3]);
	});



	describe('#confighandler', function()
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clients: {
					client_its: {
						confighandler: require('./pkghandler/client_its')
					}
				}
			});

		runClientHandlerIts(linker);

		it('#methods', function()
		{
			return linker.methods()
				.then(function(map)
				{
					expect(map.client_its).to.be.an('object');
					var methods = Object.keys(map.client_its.methods);
					expect(methods).to.eql([
						'method',
						'method_params',
						'method_promise_resolve',
						'method_promise_reject_number',
						'method_promise_reject_error',
						'method_callback_data',
						'method_callback_error_number',
						'method_callback_error_error'
					]);
					expect(map.client_its.methods.method_params[0].handler)
						.to.be.an('function');
				});
		});
	});


	describe('#pkghandler', function()
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

		runClientHandlerIts(linker);

		it('#methods', function()
		{
			return linker.methods()
				.then(function(map)
				{
					expect(map.client_its).to.be.an('object');
					expect(map.client_its.client.options.opt).to.be('myOpt');
					expect(map.client_its.client.options.pkghandler)
						.to.contain(__dirname);
					expect(map.client2.client.options.pkghandler)
						.to.contain('pkghandler/not_exsits');

					var methods = Object.keys(map.client_its.methods);
					expect(methods).to.eql([
						'method',
						'method_params',
						'method_promise_resolve',
						'method_promise_reject_number',
						'method_promise_reject_error',
						'method_callback_data',
						'method_callback_error_number',
						'method_callback_error_error'
					]);
					expect(map.client_its.methods.method_params[0].handler)
						.to.be.an('function');
				});
		});
	});

	describe('#logger', function()
	{
		var logger = require('../flows/logger/logger');
		function PromiseDeffer()
		{
			var resolve, reject;
			var promise = new Promise(function(resolve0, reject0)
			{
				resolve = resolve0;
				reject = reject0;
			});

			return {
				promise: promise,
				resolve: resolve,
				reject: reject
			};
		}

		function simpleLinker(genLoggerHander)
		{
			return ClientLinker(
				{
					flows: ['logger', 'confighandler'],
					clients:
					{
						client_run:
						{
							logger: genLoggerHander('run'),
							confighandler:
							{
								method: function()
								{
									return Promise.resolve('success');
								}
							}
						},
						client_error:
						{
							logger: genLoggerHander('error'),
							confighandler:
							{
								method: function()
								{
									return Promise.reject(new Error('error'));
								}
							}
						}
					}
				});
		}

		it('#param', function()
		{
			var runDeffer = PromiseDeffer();
			var errorDeffer = PromiseDeffer();
			var linker = simpleLinker(function(type)
			{
				return function(runtime, err, data)
				{
					try {
						var timing = runtime.timing;
						var lastFlowTiming = runtime.lastFlow().timing;

						expect(lastFlowTiming.start).to.be.an('number');
						expect(lastFlowTiming.end).to.be.an('number');
						expect(timing.flowsStart).to.be.an('number');
						expect(timing.flowsEnd).to.be.an('number');

						if (type == 'error')
						{
							expect(err.message).to.be('error');
							expect(err.fromClient).to.be('client_error');
							expect(err.fromClientFlow).to.be('confighandler');
							expect(data).to.be(null);
							errorDeffer.resolve();
						}
						else
						{
							expect(err).to.be(null);
							expect(data).to.be('success');
							runDeffer.resolve();
						}
					}
					catch(err)
					{
						type == 'error'
							? errorDeffer.reject(err)
							: runDeffer.reject(err);
					}
				};
			});

			return Promise.all(
			[
				linker.run('client_run.method'),
				linker.run('client_error.method')
					.then(function(){expect().fail()}, function(){}),
				runDeffer.promise,
				errorDeffer.promise
			]);
		});

		it('#defaultLoggerHander', function()
		{
			var runDeffer = PromiseDeffer();
			var errorDeffer = PromiseDeffer();
			var linker = simpleLinker(function(type)
			{
				return function()
				{
					try {
						logger.loggerHandler.apply(null, arguments);
						if (type == 'error')
							errorDeffer.resolve();
						else
							runDeffer.resolve();
					}
					catch(err)
					{
						if (type == 'error')
							errorDeffer.reject(err);
						else
							runDeffer.reject(err);
					}
				};
			});

			return Promise.all(
			[
				linker.run('client_run.method'),
				linker.run('client_error.method')
					.then(function(){expect().fail()}, function(){}),
				runDeffer.promise,
				errorDeffer.promise
			]);
		});
	});



	describe('#debugger', function()
	{
		var linker = ClientLinker(
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
});
