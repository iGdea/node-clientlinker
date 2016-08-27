"use strict";

var Promise			= require('bluebird');
var ClientLinker	= require('../');
var expect			= require('expect.js');

describe('#compatible', function()
{
	it('#runOptions', function()
	{
		var linker = ClientLinker(
			{
				flows: [function flow(runtime, callback)
					{
						expect(runtime.runOptions.param).to.be('pp');
						runtime.runOptions.param = 'p1';
						expect(runtime.options.param).to.be('p1');
						runtime.runOptions = {param: 'p2'}
						expect(runtime.options.param).to.be('p2');

						callback();
					}],
				clients:
				{
					client: {}
				}
			});

		return linker.run('client.method', null, null, null, {param: 'pp'});
	});


	it('#navigationStart', function()
	{
		var linker = ClientLinker(
			{
				flows: ['debugger'],
				clients:
				{
					client: null
				}
			});

		return linker.run('client.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.__runtime__.timing.navigationStart).to.be.a('number');
					expect(err.__runtime__.timing.navigationStart).to.be(err.__runtime__.navigationStart);
				});
	});


	it('#runByKey', function()
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
							method: function(query, body, callback)
							{
								callback();
							}
						}
					}
				}
			});

		return Promise.all(
			[
				linker.runByKey('client.method'),
				linker.runByKey('client:method')
			]);
	});


	it('#proxyRoute', function()
	{
		var linker = ClientLinker()

		expect(linker.proxyRoute().name).to.be('HttpProxyRouteHandle');
	});


	it('#add', function()
	{
		var linker = ClientLinker()
		linker.add('clientName1', {opt: 'myOpt'});

		return linker.clients()
			.then(function(map)
			{
				expect(map).to.be.an('object');
				expect(map.clientName1.name).to.be('clientName1');
				expect(map.clientName1.options).to.be.eql({opt: 'myOpt'});
			});
	});


	it('#clientDefaultOptions', function()
	{
		var linker = ClientLinker(
			{
				clientDefaultOptions:
				{
					opt: 'default',
					some: 'hihi'
				},
				clients:
				{
					client1: null,
					client2:
					{
						opt: 'myOpt'
					}
				}
			});

		linker.options.clientDefaultOptions = {opt: 'newOpt'};
		linker.addClient('client3');
		linker.addClient('client4', {some: 'ctd'});

		return linker.clients()
			.then(function(map)
			{
				expect(map.client1.options).to.be.eql(
					{
						opt: 'default',
						some: 'hihi'
					});

				expect(map.client2.options).to.be.eql(
					{
						opt: 'myOpt',
						some: 'hihi'
					});

				expect(map.client3.options).to.be.eql(
					{
						opt: 'newOpt'
					});

				expect(map.client4.options).to.be.eql(
					{
						opt: 'newOpt',
						some: 'ctd'
					});
			});
	});


	it('#loadFlow', function()
	{
		var linker = ClientLinker()

		expect(linker.loadFlow('flow_empty', './flows/flow_empty', module)).to.not.be.ok();
		expect(linker.loadFlow('flow_resolve', './flows/flow_resolve', module)).to.be.ok();
		expect(linker.loadFlow('flow_next', './flows/flow_next', module)).to.be.ok();

		linker.addClient('client1', {flows: ['flow1', 'flow_empty', 'flow_next', 'flow_resolve']});

		return linker.run('client1.xxxx')
			.then(function(data)
			{
				expect(data).to.be('flow_resolve');
			});
	});


	it('#methodKey', function()
	{
		var linker = ClientLinker(
			{
				flows: ['debugger'],
				clients:
				{
					client:
					{
						debuggerRuntime: true
					}
				}
			});

		return linker.run('client.method')
			.then(function(){expect().fail()},
				function(runtime)
				{
					expect(runtime.methodKey).to.be('client.method')
						.be(runtime.action);
				});
	});
});
