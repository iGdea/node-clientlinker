"use strict";

var Promise			= require('bluebird');
var expect			= require('expect.js');
var commandActions	= require('../bin/lib/command_actions');
var printTable		= require('../bin/lib/print_table');
var CONFIG_FILE		= __dirname+'/conf/simple.conf.js'

require('../bin/lib/rlutils').colors.enabled = false;

describe('#commandActions', function()
{
	it('#runAction', function()
	{
		var linker = require(CONFIG_FILE);

		return Promise.all(
			[
				commandActions.runAction(linker, 'client.success'),
				commandActions.runAction(linker, 'client.error')
					.then(function(){expect().fail()},
						function(err)
						{
							expect(err).to.be(undefined);
						})
			]);
	});


	it('#listAction', function()
	{
		var output1 = [
			'    client             confighandler   ',
			' 1  client.error       confighandler $ ',
			' 2  client.success     confighandler $ ',
			'                                       ',
			'    client2            confighandler   ',
			' 3  client2.method     confighandler $ ',
			'']
			.join('\n');

		var output2 = [
			'    client2            confighandler   ',
			' 1  client2.method     confighandler $ ',
			'']
			.join('\n');

		output1 = output1.replace(/\$/g, printTable.useSymbole);
		output2 = output2.replace(/\$/g, printTable.useSymbole);

		var promise1 = commandActions.listAction(CONFIG_FILE, {})
			.then(function(data)
			{
				expect(data.output).to.be(output1);
			});

		var promise2 = commandActions.listAction(CONFIG_FILE,
				{
					filterClient: 'client2'
				})
				.then(function(data)
				{
					expect(data.output).to.be(output2);
				});

		return Promise.all([promise1, promise2]);
	});


	it('#execAction', function()
	{
		return Promise.all(
			[
				commandActions.execAction(CONFIG_FILE, 'client.success', {}),
				commandActions.execAction(CONFIG_FILE, 'client.error', {})
					.then(function(){expect().fail()},
						function(err)
						{
							expect(err).to.be(undefined);
						}),
				commandActions.execAction(CONFIG_FILE, 'client2.method',
					{
						clkQuery: 'number:1',
						clkBody: 'string:body',
						clkOptions: '{a: 1}'
					})
					.then(function(data)
					{
						expect(data).to.be.eql(
							{
								query: 1,
								body: 'body',
								options: {a: 1}
							});
					})
			]);
	});
});
