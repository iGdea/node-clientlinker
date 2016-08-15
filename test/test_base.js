"use strict";

var Promise			= require('bluebird');
var ClientLinker	= require('../');
var assert			= require('assert');

describe('base', function()
{
	it('ownlist', function()
	{
		assert(ClientLinker.supportMiddlewares.length > 0);
		assert(ClientLinker.supportMiddlewares.indexOf('httpproxy') != -1);
	});

	it('own', function()
	{
		var linker = ClientLinker(
			{
				flows: ClientLinker.supportMiddlewares
			});

		assert.equal(Object.keys(linker.flows).length, ClientLinker.supportMiddlewares.length);
		ClientLinker.supportMiddlewares.forEach(function(name)
		{
			assert.equal(typeof linker.flows[name].handler, 'function');
		});
	});

	it('addClient', function()
	{
		var linker = new ClientLinker;

		linker.addClient('client1');
		return linker.clients()
			.then(function(clients)
			{
				assert.equal(Object.keys(clients).length, 1);
			})
			.then(function()
			{
				linker.addClient({client2: null, client3: {}});
				return linker.clients();
			})
			.then(function(clients)
			{
				assert.equal(Object.keys(clients).length, 3);
			});
	});

	it('bindFlow', function()
	{
		var linker = new ClientLinker;

		linker.bindFlow('flow1', function flow1(){});
		assert.equal(Object.keys(linker.flows).length, 1);
		linker.bindFlow({flow2: function flow2(){}, flow3: function flow3(){}});
		assert.equal(Object.keys(linker.flows).length, 3);
	});

	it('loadFlow', function()
	{
		var linker = new ClientLinker;

		assert.throws(function(){linker.loadFlow('no_exists_flow')});
		assert.throws(function(){linker.loadFlow('flow1')});
		assert.throws(function(){linker.loadFlow('flow1', './flows/flow1')});
		assert(!linker.loadFlow('flow_empty', './flows/flow_empty', module));
		assert(linker.loadFlow('flow_resolve', './flows/flow_resolve', module));
		assert(linker.loadFlow('flow_next', './flows/flow_next', module));

		linker.addClient('client1', {flows: ['flow1', 'flow_empty', 'flow_next', 'flow_resolve']});

		return linker.run('client1.xxxx')
			.then(function(data)
			{
				assert.equal(data, 'flow_resolve');
			});
	});


	it('custom', function()
	{
		var linker = ClientLinker(
			{
				flows: ['custom', 'custom2'],
				customFlows: {
					custom: function custom(){}
				}
			});

		assert.equal(Object.keys(linker.flows).length, 1);
	});

	it('pkg clients', function()
	{
		var linker1 = ClientLinker(
			{
				flows: ['pkghandler'],
				clients: {
					client1: null
				}
			});

		var linker2 = ClientLinker(
			{
				flows: ['pkghandler'],
				pkghandlerDir: __dirname+'/pkghandler',
				clients: {
					client1: null
				}
			});

		var promise1 = linker1.clients()
				.then(function(clients)
				{
					var list = Object.keys(clients);
					assert.equal(list.length, 1);
					assert.equal(list[0], 'client1');
				});

		var promise2 = linker2.clients()
				.then(function(clients)
				{
					var list = Object.keys(clients);
					assert.equal(list.length, 2);
				});

		return Promise.all([promise1, promise2]);
	});

	it('client options override', function()
	{
		var linker = ClientLinker(
			{
				flows: ['logger', 'pkghandler'],
				pkghandlerDir: __dirname+'/pkghandler',
				clients:
				{
					client:
					{
						flows: ['pkghandler']
					}
				}
			});

		return linker.clients()
				.then(function(clients)
				{
					assert.equal(clients.client.options.flows[0], 'pkghandler');
				});
	});

	it('clientrun', function(done)
	{
		// this.timeout(60*1000);
		var runned = false;
		var linker = ClientLinker(
			{
				flows: ['custom'],
				customFlows:
				{
					custom: function custom(runtime, callback)
					{
						runned = true;
						callback();
					}
				}
			});

		linker.addClient('client', {flows: ['custom']});
		linker.run('client.xxxx', null, null, function(err)
		{
			assert(!err);
			assert(runned);
			done();
		});
	});

	it('timing', function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['assertHandler', 'custom1', 'custom2'],
				customFlows:
				{
					custom1: function custom1(runtime, callback)
					{
						setTimeout(callback.next, 100);
					},
					custom2: function custom2(runtime, callback)
					{
						setTimeout(callback, 100);
					},
					assertHandler: function assertHandler(runtime, callback)
					{
						var lastFlowTiming = runtime.lastFlow().timing;
						var timing = runtime.timing;
						assert(lastFlowTiming.start - runtime.navigationStart < 10);
						assert(lastFlowTiming.start - timing.flowsStart < 10);

						callback.next();
						callback.promise.then(function()
						{
							var lastFlowTiming = runtime.lastFlow().timing;
							assert(timing.flowsEnd - lastFlowTiming.end < 3);
							assert(lastFlowTiming.start - timing.flowsStart >= 100);
							assert(lastFlowTiming.end - lastFlowTiming.start >= 100);
							done();
						});
					}
				},
				clients: {
					client: {
						method: null
					}
				}
			});

		linker.run('client.method').catch(done);
	});


	it('flow run Error', function()
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clients:
				{
					client:
					{
						confighandler:
						{
							method: function()
							{
								throw 333;
							}
						}
					}
				}
			});

		var promise = new Promise(function(resolve)
			{
				linker.run('client.method', null, null, function(err)
					{
						assert.equal(err, 333);
						resolve();
					});
			});

		return Promise.all(
			[
				promise,
				linker.run('client.method')
					.then(function()
					{
						assert(false)
					},
					function(err)
					{
						assert.equal(err, 333);
					})
			]);
	});

	it('anyToError', function()
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clientDefaultOptions: {anyToError: true},
				clients:
				{
					client:
					{
						confighandler:
						{
							method1: function(query, body, callback)
							{
								callback('errmsg');
							},
							method2: function(query, body, callback)
							{
								callback.reject();
							}
						}
					}
				}
			});

		var promise1 = linker.run('client.method1')
			.then(function(){assert(false)},
				function(err)
				{
					assert(err instanceof Error);
					assert.equal(err.message, 'errmsg');
				});

		var promise2 = linker.run('client.method2')
			.then(function(){assert(false)},
				function(err)
				{
					assert(err instanceof Error);
					assert.equal(err.message, 'CLIENT_LINKER_DEFERT_ERROR');
				});

		return Promise.all([promise1, promise2]);
	});


	it('retry', function()
	{
		var runTimes = 0;
		var linker = ClientLinker(
			{
				flows: ['timingCheck', 'confighandler'],
				customFlows:
				{
					timingCheck: function(runtime, callback)
					{
						runTimes++;
						if (runTimes == 2)
							assert(runtime.retry[0].timing.flowsEnd);

						callback.next();
					}
				},
				clientDefaultOptions:
				{
					retry: 5,
					anyToError: true
				},
				clients:
				{
					client:
					{
						confighandler:
						{
							method: function(query, body, callback)
							{
								if (runTimes == 1)
									throw 333;
								else
								{
									callback(null, 555);
								}
							}
						}
					}
				}
			});

		return linker.run('client.method')
				.then(function(data)
				{
					assert.equal(data, 555);
					assert.equal(runTimes, 2);
				});
	});

	it('callback domain', function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clients:
				{
					client:
					{
						confighandler:
						{
							method: function()
							{
								return Promise.resolve();
							}
						}
					}
				}
			});

		var domain = require('domain');
		var dm = domain.create();

		dm.on('error', function(err)
			{
				assert.equal(err, 333);
				done();
			});
		dm.run(function()
			{
				linker.run('client.method', null, null, function(err)
				{
					assert(!err);
					throw 333;
				});
			});
	});

	it('promise domain', function()
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clients:
				{
					client:
					{
						confighandler:
						{
							method1: function()
							{
								return Promise.resolve(111);
							},
							method2: function()
							{
								return Promise.resolve(222);
							},
							method3: function()
							{
								return Promise.reject(333);
							}
						}
					}
				}
			});

		var domain = require('domain');
		var dm = domain.create();
		dm._mark_assert = 234;

		return new Promise(function(resolve, reject)
			{
				dm.on('error', reject);
				dm.run(function()
					{
						linker.run('client.method1')
							.then(function(data)
							{
								assert(domain.active);
								assert.equal(domain.active._mark_assert, 234);
								assert.equal(data, 111);
								return linker.run('client.method2');
							})
							.then(function(data)
							{
								assert(domain.active);
								assert.equal(domain.active._mark_assert, 234);
								assert.equal(data, 222);
								var promise = linker.run('client.method3');
								promise.catch(function(err)
									{
										assert.equal(err, 333);
										resolve();
									});
								return promise;
							});
					});
			});

	});

	it('throw null err', function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clients:
				{
					client:
					{
						confighandler:
						{
							method: function()
							{
								return Promise.reject();
							}
						}
					}
				}
			});

		linker.run('client.method', null, null, function(err)
			{
				assert.equal(err, 'CLIENT_LINKER_DEFERT_ERROR');
				setTimeout(done, 10);
			})
			.then(function()
			{
				assert(false);
			},
			function(err)
			{
				assert.equal(err, undefined);
			});
	});


	it('addon domain', function()
	{
		var addon = require('nan-async-example');
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clients:
				{
					client:
					{
						confighandler:
						{
							callback: function(query, body, callback)
							{
								addon(callback);
							},
							resolve: function()
							{
								return new Promise(function(resolve)
								{
									addon(function(err, data)
									{
										resolve(data);
									});
								});
							}
						}
					}
				}
			});

		var domain = require('domain');
		var dm = domain.create();
		dm._mark_assert = 222;

		var promise1 = dm.run(function()
		{
			var promise11;
			var promise12 = new Promise(function(resolve, reject)
				{
					promise11 = linker.run('client.callback', null, null, function(err, data)
					{
						assert.equal(data, 'hello world');
						assert.equal(domain.active._mark_assert, 222);
						resolve();
					})
					.then(function(data)
					{
						assert.equal(data, 'hello world');
						assert.equal(domain.active._mark_assert, 222);
					});
				});

			return Promise.all([promise11, promise12]);
		});

		var dm2 = domain.create();
		dm2._mark_assert = 333;

		var promise2 = dm2.run(function()
		{
			return linker.run('client.resolve')
				.then(function(data)
				{
					assert.equal(data, 'hello world');
					assert.equal(domain.active._mark_assert, 333);
				});
		});

		return Promise.all([promise1, promise2]);
	});
});
