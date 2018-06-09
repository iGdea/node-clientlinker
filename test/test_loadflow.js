"use strict";

var ClientLinker	= require('../');
var expect			= require('expect.js');

describe('#loadFlow', function()
{
	it('#module', function()
	{
		var linker = ClientLinker();
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

	it('#handler', function()
	{
		var linker = ClientLinker();
		var loadFlow = linker.loadFlow(module);
		expect(loadFlow('./flows/flow_empty', module)).to.not.be.ok();
		expect(loadFlow('./flows/flow_resolve', module)).to.be.ok();
		expect(loadFlow('./flows/flow_next', module)).to.be.ok();

		linker.addClient('client1', {flows: ['flow1', 'flow_empty', 'flow_next', 'flow_resolve']});

		return linker.run('client1.xxxx')
			.then(function(data)
			{
				expect(data).to.be('flow_resolve');
			});
	});

	it('#error', function()
	{
		var linker = ClientLinker();
		expect(function(){linker.loadFlow('no_exists_flow')}).to.throwError();
		expect(function(){linker.loadFlow('flow1')}).to.throwError();
		expect(function(){linker.loadFlow('./flows/flow1')}).to.throwError();
		expect(function(){linker.loadFlow('./flows/flow_resolve')}).to.throwError();
		expect(function(){linker.loadFlow('./flows/flow_next')}).to.throwError();
	});

});
