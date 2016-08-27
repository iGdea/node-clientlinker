"use strict";

var Promise			= require('bluebird');
var ClientLinker	= require('../');
var expect			= require('expect.js');

describe('#run_error', function()
{
	it('!flow run Error', function()
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				defaults:
				{
					exportErrorInfo: true
				},
				clients:
				{
					client:
					{
						confighandler:
						{
							method: function()
							{
								throw 333;
							},
							method2: function()
							{
								throw new Error;
							},
						}
					},
					client2:
					{
						flows: []
					}
				}
			});

		var promise1 = new Promise(function(resolve)
			{
				linker.run('client.method', null, null, function(err)
					{
						expect(err).to.be(333);
						resolve();
					});
			});

		var promise2 = linker.run('client.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be(333);
				});

		var promise3 = linker.run('client.method1')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.contain('CLIENTLINKER:CLIENT FLOW OUT');
					expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
					expect(err.CLIENTLINKER_METHODKEY).to.be('client.method1');
					expect(err.CLIENTLINKER_CLIENT).to.be('client');
				});

		var promise4 = linker.run('client1.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.contain('CLIENTLINKER:NO CLIENT');
					expect(err.CLIENTLINKER_TYPE).to.be('NO CLIENT');
					expect(err.CLIENTLINKER_METHODKEY).to.be('client1.method');
				});

		var promise5 = linker.run('client2.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.contain('CLIENTLINKER:CLIENT NO FLOWS');
					expect(err.CLIENTLINKER_TYPE).to.be('CLIENT NO FLOWS');
					expect(err.CLIENTLINKER_METHODKEY).to.be('client2.method');
					expect(err.CLIENTLINKER_CLIENT).to.be('client2');
				});

		var promise6 = linker.run('client.method1')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be.a(Error);
					expect(err.fromClient).to.be('client');
					expect(err.fromClientFlow).to.be('confighandler');
					expect(err.fromClientMethod).to.be('method1');
				});


		return Promise.all(
			[
				promise1, promise2, promise3, promise4, promise5, promise6
			]);
	});

	it('!anyToError', function()
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				defaults: {anyToError: true},
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
							},
							method3: function(query, body, callback)
							{
								callback(-1);
							},
							method4: function(query, body, callback)
							{
								callback(new Error('errmsg'));
							}
						}
					}
				}
			});

		var promise1 = linker.run('client.method1')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be.an(Error);
					expect(err.message).to.be('errmsg');
					expect(err.isClientLinkerNewError).to.be.ok();
				});

		var promise2 = linker.run('client.method2')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be.an(Error);
					expect(err.message).to.be('CLIENT_LINKER_DEFERT_ERROR');
					expect(err.isClientLinkerNewError).to.be.ok();
				});

		var promise3 = linker.run('client.method3')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be.an(Error);
					expect(err.message).to.be('client,client.method3,-1');
					expect(err.isClientLinkerNewError).to.be.ok();
				});

		var promise4 = linker.run('client.method4')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be.an(Error);
					expect(err.message).to.be('errmsg');
					expect(err.isClientLinkerNewError).to.not.be.ok();
				});

		var promise5 = linker.run('client.method5')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be.an(Error);
					expect(err.message).to.be('CLIENTLINKER:CLIENT FLOW OUT,client.method5,1');
					expect(err.isClientLinkerNewError).to.not.be.ok();
				});

		return Promise.all([promise1, promise2, promise3, promise4, promise5]);
	});


	it('!retry', function()
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
							expect(runtime.retry[0].timing.flowsEnd).to.be.ok();

						callback.next();
					}
				},
				defaults:
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
					expect(data).to.be(555);
					expect(runTimes).to.be(2);
				});
	});

	it('!throw null err', function(done)
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
				expect(err).to.be('CLIENT_LINKER_DEFERT_ERROR');
				setTimeout(done, 10);
			})
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be(undefined);
				});
	});
});
