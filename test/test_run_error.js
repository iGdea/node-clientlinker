'use strict';

var Promise			= require('bluebird');
var clientlinker	= require('../');
var expect			= require('expect.js');

describe('#run_error', function()
{
	it('#flow run Error', function()
	{
		var linker = clientlinker(
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
							},
							method2: function()
							{
								throw new Error('errmsg');
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
					expect(err.message).to.contain('CLIENTLINKER:NotFound');
					expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
					expect(err.CLIENTLINKER_ACTION).to.be('client.method1');
					expect(err.CLIENTLINKER_CLIENT).to.be('client');
				});

		var promise4 = linker.run('client1.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.contain('CLIENTLINKER:NotFound');
					expect(err.CLIENTLINKER_TYPE).to.be('NO CLIENT');
					expect(err.CLIENTLINKER_ACTION).to.be('client1.method');
				});

		var promise5 = linker.run('client2.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.contain('CLIENTLINKER:NotFound');
					expect(err.CLIENTLINKER_TYPE).to.be('CLIENT NO FLOWS');
					expect(err.CLIENTLINKER_ACTION).to.be('client2.method');
					expect(err.CLIENTLINKER_CLIENT).to.be('client2');
				});

		var promise6 = linker.run('client.method1')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be.a(Error);
					expect(err.fromClient).to.be('client');
					expect(err.fromClientFlow).to.be(undefined);
					expect(err.fromClientMethod).to.be('method1');
				});

		var promise7 = linker.run('client.method2')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be.a(Error);
					expect(err.message).to.be('errmsg');
					expect(err.fromClient).to.be('client');
					expect(err.fromClientFlow).to.be('confighandler');
					expect(err.fromClientMethod).to.be('method2');
				});

		return Promise.all(
			[
				promise1, promise2, promise3, promise4,
				promise5, promise6, promise7
			]);
	});


	it('#not exportErrorInfo', function()
	{
		var linker = clientlinker(
			{
				flows: ['confighandler'],
				defaults:
				{
					exportErrorInfo: false,
				},
				clients:
				{
					client:
					{
						confighandler:
						{
							method: function()
							{
								throw new Error('errmsg');
							}
						}
					}
				}
			});

		return linker.run('client.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be.a(Error);
					expect(err.message).to.be('errmsg');
					expect(err.fromClient).to.be(undefined);
					expect(err.fromClientFlow).to.be(undefined);
					expect(err.fromClientMethod).to.be(undefined);
				});
	});

	it('#anyToError', function()
	{
		var linker = clientlinker(
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
					expect(err.message)
						.to.be('CLIENTLINKER:NotFound,client.method5');
					expect(err.isClientLinkerNewError)
						.to.not.be.ok();
				});

		return Promise.all([promise1, promise2, promise3, promise4, promise5]);
	});


	it('#from flow run', function()
	{
		var linker = clientlinker(
			{
				flows: ['custom'],
				customFlows: {
					custom: function()
					{
						throw new Error('from flow run');
					}
				},
				clients:
				{
					client: null
				}
			});

		return linker.run('client.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.be('from flow run');
				});
	});


	describe('#retry', function()
	{
		it('#in defualts', function()
		{
			var runTimes = 0;
			var linker = clientlinker(
				{
					flows: ['timlineCheck', 'confighandler'],
					customFlows:
					{
						timlineCheck: function(runtime, callback)
						{
							runTimes++;
							if (runTimes == 2)
							{
								expect(runtime.retry[0].timline.flowsEnd)
									.to.be.ok();
							}

							return callback.next();
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

		it('#runOptions', function()
		{
			var runTimes = 0;
			var linker = clientlinker(
				{
					flows: ['timlineCheck', 'confighandler'],
					customFlows:
					{
						timlineCheck: function(runtime, callback)
						{
							runTimes++;
							if (runTimes == 2)
							{
								expect(runtime.retry[0].timline.flowsEnd)
									.to.be.ok();
							}

							return callback.next();
						}
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

			return linker.run('client.method', null, null, {retry: 5})
					.then(function(data)
					{
						expect(data).to.be(555);
						expect(runTimes).to.be(2);
					});
		});
	});

	it('#throw null err', function()
	{
		var linker = clientlinker(
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

		var resolve;
		var callbackPromise = new Promise(function(resolve0){resolve = resolve0});
		var runPromise = linker.run('client.method', null, null, function(err)
			{
				expect(err).to.be('CLIENT_LINKER_DEFERT_ERROR');
				resolve();
			})
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be(undefined);
				});

		return Promise.all([callbackPromise, runPromise]);
	});
});
