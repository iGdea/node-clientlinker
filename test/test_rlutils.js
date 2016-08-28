"use strict";

var Promise			= require('bluebird');
var utils			= require('../bin/utils');
var runArgv			= require('../bin/run_argv');
var expect			= require('expect.js');
var ClientLinker	= require('../');

describe('#rlutils', function()
{
	it('#parseParam', function()
	{
		var linker = ClientLinker()
		expect(utils.parseParam(linker, '{"key": "value"}').key).to.be('value');
		expect(utils.parseParam(linker, '{key: "value"}').key).to.be('value');
		expect(utils.parseParam(linker, '{\'key\': "value"}').key).to.be('value');
		expect(utils.parseParam(linker, '({key: "value"})').key).to.be('value');
		expect(utils.parseParam(linker, './test/localfile/client/json.json').data.string).to.be('string');
	});


	it('#printObject', function()
	{
		expect(utils.printObject(new Error('errmsg')))
			.to.contain('Error: errmsg')
			.contain(__dirname)
			.contain(__filename);

		expect(utils.printObject('something')).to.contain('something');
	});


	it('#methods', function()
	{
		var linker = ClientLinker(
			{
				flows: ['pkghandler'],
				pkghandlerDir: __dirname+'/pkghandler'
			});

		return linker.methods()
			.then(function(list)
			{
				return runArgv.getAllMethods(list);
			})
			.then(function(allMethods)
			{
				expect(allMethods).to.not.be.empty();
				expect(allMethods[2]).to.be('client_its.method_callback_error_error');
				expect(allMethods.lines[2].index).to.be(2);

				expect(utils.parseAction('2', allMethods))
					.to.be('client_its.method_callback_data');
				expect(utils.parseAction('client_its.method_callback_data', allMethods))
					.to.be('client_its.method_callback_data');
				expect(utils.parseAction('', allMethods)).to.be(undefined);
				expect(utils.parseAction('1999', allMethods)).to.be(undefined);
				expect(utils.parseAction('client_not_exists.method', allMethods))
					.to.be(undefined);
			});
	});


	it('#run', function()
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
							success: function()
							{
								return Promise.resolve();
							},
							error: function()
							{
								return Promise.reject();
							}
						}
					}
				}
			});

		return Promise.all(
			[
				utils.run(linker, 'client.success'),
				utils.run(linker, 'client.errror')
			]);
	});
});
