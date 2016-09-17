"use strict";

var Promise			= require('bluebird');
var expect			= require('expect.js');
var commandActions	= require('../bin/lib/command_actions');
var printTable		= require('../bin/lib/print_table');
var printTpl		= require('../bin/lib/print_tpl');

var CONFIG_FILE			= __dirname+'/conf/simple.conf.js';
var EMPTY_CONFIG_FILE	= __dirname+'/conf/empty.conf.js';

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
			'    client               confighandler   ',
			' 1  client.error         confighandler $ ',
			' 2  client.error2        confighandler $ ',
			' 3  client.success       confighandler $ ',
			'                                         ',
			'    client2              confighandler   ',
			' 4  client2.method       confighandler $ ',
			'                                         ',
			'    client3              confighandler   ',
			'    ** No Methods **                     ',
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

		var promise3 = commandActions.listAction(EMPTY_CONFIG_FILE, {})
				.then(function(){expect().fail()},
					function(err)
					{
						expect(err.message).to.be('No Client Has Methods');
					});

		return Promise.all([promise1, promise2, promise3]);
	});


	describe('#execAction', function()
	{
		it('#run suc', function()
		{
			return Promise.all(
				[
					commandActions.execAction(CONFIG_FILE, 'client.success', {}),
					commandActions.execAction(CONFIG_FILE, '3', {}),
					commandActions.execAction(CONFIG_FILE, 3, {})
				]);
		});

		it('#run err', function()
		{
			var promise1 = commandActions.execAction(CONFIG_FILE, 'client.error', {})
				.then(function(){expect().fail()},
					function(err)
					{
						expect(err).to.be(undefined);
					});

			var promise2 = commandActions.execAction(CONFIG_FILE, 'client.error2', {})
				.then(function(){expect().fail()},
					function(err)
					{
						expect(err).to.be('errmsg');
					});

			return Promise.all([promise1, promise2]);
		});

		it('#no methods err', function()
		{
			return commandActions.execAction(EMPTY_CONFIG_FILE, 1, {})
				.then(function(){expect().fail()},
					function(err)
					{
						expect(err.message).to.be('No Client Has Methods');
					});
		});

		it('#parse params', function()
		{
			return commandActions.execAction(CONFIG_FILE, 'client2.method',
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
				});
		});

		it('#no action err', function()
		{
			return commandActions.execAction(CONFIG_FILE, 9999, {})
				.then(function(){expect().fail()},
					function(err)
					{
						expect(err.message).to.be('Not Found Action');
					});
		});
	});
});


describe('#printTpl', function()
{
	it('#runActionUnexpectedError', function()
	{
		expect(printTpl.runActionUnexpectedError('action', 'errmsg'))
			.to.be("\n ========= Unexpected Error action ========= \n'errmsg'");
	});

	it('#rlRunHeader', function()
	{
		printTpl.rlRunHeader();
	});
});
