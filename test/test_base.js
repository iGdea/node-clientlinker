require('debug').enable('client_linker*');

var ClientLinker	= require('../');
var assert			= require('assert');

describe('client linker', function()
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

		var noHiproto = !linker.flows['hiproto'];
		assert.equal(Object.keys(linker.flows).length, ClientLinker.supportMiddlewares.length+(noHiproto ? -1 : 0));
		ClientLinker.supportMiddlewares.forEach(function(name)
		{
			if (name != 'hiproto' || !noHiproto)
			{
				assert.equal(typeof linker.flows[name], 'function');
			}
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

		linker.add('client', {flows: ['custom']});
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
						var timing = runtime.timing;
						assert(timing.lastFlowStart - timing.navigationStart < 10);
						assert.equal(timing.lastFlowStart, timing.flowsStart);

						callback.next();
						callback.promise.then(function()
						{
							assert.equal(timing.lastFlowEnd, timing.flowsEnd);
							assert(timing.lastFlowStart - timing.flowsStart >= 100);
							assert(timing.lastFlowEnd - timing.lastFlowStart >= 100);
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


	it('anyToError', function()
	{
		var linker = ClientLinker(
			{
				anyToError: true,
				flows: ['confighandler'],
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

	it('flow run Error', function(done)
	{
		var linker = ClientLinker(
			{
				anyToError: true,
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

		linker.run('client.method', null, null, function(err)
			{
				assert(err instanceof Error);
				done();
			});
	});

	it('callback err', function(done)
	{
		var linker = ClientLinker(
			{
				anyToError: true,
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
});
