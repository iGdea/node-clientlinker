"use strict";

var Promise			= require('bluebird');
var ClientLinker	= require('../');
var expect			= require('expect.js');


describe('#base', function()
{
	it('!ownlist', function()
	{
		expect(ClientLinker.supportMiddlewares.length).to.be.above(0);
		expect(ClientLinker.supportMiddlewares).to.contain('httpproxy');
	});

	it('!own', function()
	{
		var linker = ClientLinker(
			{
				flows: ClientLinker.supportMiddlewares
			});

		expect(Object.keys(linker.flows).length).to.be(ClientLinker.supportMiddlewares.length);
		ClientLinker.supportMiddlewares.forEach(function(name)
		{
			expect(linker.flows[name].handler).to.be.an('function');
		});
	});

	it('!addClient', function()
	{
		var linker = new ClientLinker;

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

	it('!bindFlow', function()
	{
		var linker = new ClientLinker;

		linker.bindFlow('flow1', function flow1(){});
		expect(Object.keys(linker.flows).length).to.be(1);
		linker.bindFlow({flow2: function flow2(){}, flow3: function flow3(){}});
		expect(Object.keys(linker.flows).length).to.be(3);
	});

	it('!loadFlow', function()
	{
		var linker = new ClientLinker;

		expect(function(){linker.loadFlow('no_exists_flow')}).to.throwError();
		expect(function(){linker.loadFlow('flow1')}).to.throwError();
		expect(function(){linker.loadFlow('./flows/flow1')}).to.throwError();
		expect(linker.loadFlow('./flows/flow_empty', module)).to.not.be.ok();
		expect(linker.loadFlow('./flows/flow_resolve', module)).to.be.ok();
		expect(linker.loadFlow('./flows/flow_next', module)).to.be.ok();

		linker.addClient('client1', {flows: ['flow1', 'flow_empty', 'flow_next', 'flow_resolve']});

		return linker.run('client1.xxxx')
			.then(function(data)
			{
				expect(data).to.be('flow_resolve');
			});
	});


	it('!custom', function()
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

	it('!pkg clients', function()
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

	it('!client options override', function()
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
					expect(clients.client.options.flows[0]).to.be('pkghandler');
				});
	});

	it('!clientrun', function(done)
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

	it('!timing', function(done)
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
						try {
							var lastFlowTiming = runtime.lastFlow().timing;
							var timing = runtime.timing;

							expect(lastFlowTiming.start).to.be.above(runtime.navigationStart-1);
							expect(lastFlowTiming.start - runtime.navigationStart).to.be.below(10);

							expect(lastFlowTiming.start).to.be.above(timing.flowsStart-1);
							expect(lastFlowTiming.start - timing.flowsStart).to.below(10);

							callback.next();
							callback.promise.then(function()
							{
								var lastFlowTiming = runtime.lastFlow().timing;

								expect(timing.flowsEnd).to.be.above(lastFlowTiming.end-1);
								expect(timing.flowsEnd - lastFlowTiming.end).to.be.below(10);

								expect(lastFlowTiming.start).to.be.above(timing.flowsStart);
								expect(lastFlowTiming.start - timing.flowsStart).to.above(100-1);

								expect(lastFlowTiming.end).to.be.above(lastFlowTiming.start);
								expect(lastFlowTiming.end - lastFlowTiming.start).to.be.above(100-1);

								done();
							})
							.catch(done);
						}
						catch(err)
						{
							done(err);
						}
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

});
