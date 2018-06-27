'use strict';

var Promise			= require('bluebird');
var ClientLinker	= require('../');
var STATIC			= require('../lib/static');
var expect			= require('expect.js');


describe('#base', function()
{
	it('#own', function()
	{
		var sysflowsArr = Object.keys(STATIC.sysflows);
		var linker = ClientLinker(
			{
				flows: sysflowsArr
			});

		expect(Object.keys(linker.flows).length).to.be(sysflowsArr.length);
		sysflowsArr.forEach(function(name)
		{
			expect(linker.flows[name].handler).to.be.an('function');
		});
	});

	it('#addClient', function()
	{
		var linker = ClientLinker()

		linker.addClient('client1');
		return linker.clients()
			.then(function(clients)
			{
				expect(Object.keys(clients).length).to.be(1);
			})
			.then(function()
			{
				linker.addClient({client2: null, client3: {}});
				return linker.clients();
			})
			.then(function(clients)
			{
				expect(Object.keys(clients).length).to.be(3);
			});
	});

	describe('#bindFlow', function()
	{
		it('#function', function()
		{
			var linker = ClientLinker();
			linker.bindFlow('flow1', function flow1(){});
			expect(Object.keys(linker.flows).length).to.be(1);
		});

		it('#object', function()
		{
			var linker = ClientLinker();
			linker.bindFlow({flow2: function flow2(){}, flow3: function flow3(){}});
			expect(Object.keys(linker.flows).length).to.be(2);
		});

		it('#same', function()
		{
			var linker = ClientLinker();
			linker.bindFlow('flow1', function flow1(){});
			linker.bindFlow('flow1', function flow2(){});
			expect(Object.keys(linker.flows).length).to.be(1);
		});

		describe('#width init', function()
		{
			it('#promise', function()
			{
				var linker = ClientLinker();
				function flowHanlder(){}
				flowHanlder.init = function(linker2)
				{
					expect(linker2).to.be(linker);
					return new Promise(function(resolve)
					{
						setTimeout(function()
						{
							linker._test_val = '111';
							resolve();
						}, 10);
					});
				}

				linker.bindFlow('flowInit', flowHanlder);

				return linker.clients()
					.then(function()
					{
						expect(linker._test_val).to.be('111');
					});
			});

			it('#ignore bind', function()
			{
				var linker = ClientLinker();
				function flowHanlder(){}
				flowHanlder.init = function()
				{
					return false;
				}

				linker.bindFlow('flowInit', flowHanlder);

				return linker.clients()
					.then(function()
					{
						expect(Object.keys(linker.flows).length).to.be(0);
					});
			});

			it('#throw err', function()
			{
				var linker = ClientLinker();
				function flowHanlder(){}
				flowHanlder.init = function()
				{
					throw new Error;
				}

				expect(function()
					{
						linker.bindFlow('flowInit', flowHanlder);
					})
					.to.throwError();
			});
		});

	});


	it('#custom flow', function()
	{
		var linker = ClientLinker(
			{
				flows: ['custom', 'custom2'],
				customFlows: {
					custom: function custom(){}
				}
			});

		expect(Object.keys(linker.flows).length).to.be(1);
	});

	it('#pkg clients', function()
	{
		var linker1 = ClientLinker(
			{
				flows: ['pkghandler'],
				clients:
				{
					client1: null
				}
			});

		var linker2 = ClientLinker(
			{
				flows: ['pkghandler'],
				clients:
				{
					client1: null,
					client_its:
					{
						pkghandler: __dirname+'/pkghandler/client_its'
					}
				}
			});

		var promise1 = linker1.clients()
				.then(function(clients)
				{
					var list = Object.keys(clients);
					expect(list.length).to.be(1);
					expect(list[0]).to.be('client1');
				});

		var promise2 = linker2.clients()
				.then(function(clients)
				{
					var list = Object.keys(clients);
					expect(list.length).to.be(2);
				});

		return Promise.all([promise1, promise2]);
	});

	it('#client options override', function()
	{
		var linker = ClientLinker(
			{
				flows: ['logger', 'pkghandler'],
				clients:
				{
					client:
					{
						flows: ['pkghandler']
					},
					client_its:
					{
						pkghandler: __dirname+'/pkghandler/client_its'
					}
				}
			});

		return linker.clients()
				.then(function(clients)
				{
					expect(clients.client.options.flows[0]).to.be('pkghandler');
				});
	});

	it('#clientrun', function(done)
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
			expect(err).to.be(null);
			expect(runned).to.be.ok();
			done();
		});
	});


	it('#getRunnedFlowByName', function()
	{
		var linker = ClientLinker(
			{
				flows: ['pkghandler', 'confighandler'],
				clients:
				{
					client:
					{
						confighandler:
						{
							method: function()
							{
								return Promise.resolve('heihei');
							}
						}
					}
				}
			});

		var retPromise = linker.run('client.method');
		return retPromise.then(function(data)
			{
				var runtime = retPromise.runtime;
				var flowsRun = runtime.retry[0];
				var configCallback = flowsRun.getRunnedFlowByName('confighandler');
				var configCallback2 = flowsRun.runnedFlows[1];

				expect(configCallback.flow.name).to.be('confighandler');
				expect(configCallback.flow).to.eql(configCallback2.flow);

				return configCallback.promise.then(function(data2)
					{
						expect(data2).to.be(data);
						expect(data2).to.be('heihei');
					});
			});
	});

});
