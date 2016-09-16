"use strict";

var Promise			= require('bluebird');
var utils			= require('../bin/lib/utils');
var runArgv			= require('../bin/lib/run_argv');
var expect			= require('expect.js');
var ClientLinker	= require('../');
var path			= require('path');

describe('#rlutils', function()
{
	describe('#parseParam', function()
	{
		var linker = ClientLinker()

		it('#base', function()
		{
			expect(utils.parseParam(linker, '')).to.be('');
			expect(utils.parseParam(linker, null)).to.be(null);
			expect(utils.parseParam(linker, 0)).to.be(0);

			expect(utils.parseParam(linker, '{"key": "value"}').key).to.be('value');
			expect(utils.parseParam(linker, '{key: "value"}').key).to.be('value');
			expect(utils.parseParam(linker, '{\'key\': "value"}').key).to.be('value');
			expect(utils.parseParam(linker, '({key: "value"})').key).to.be('value');
		});

		it('#jsonfile', function()
		{
			var file = './test/localfile/client/json.json';

			var data = utils.parseParam(linker, 'file-json:'+file);
			expect(data.data.string).to.be('string');

			data = utils.parseParam(linker, 'require:'+file);
			expect(data.data.string).to.be('string');
		});

		it('#jsfile', function()
		{
			var file = './test/localfile/client/js.js';

			var data = utils.parseParam(linker, 'file-js:'+file);
			expect(data.result).to.be.an(Error);
			expect(data.result.message).to.be('local file errmsg');
			expect(data.data.string).to.be('string');

			data = utils.parseParam(linker, 'require:'+file);
			expect(data.result).to.be.an(Error);
			expect(data.result.message).to.be('local file errmsg');
			expect(data.data.string).to.be('string');
		});

		it('#file-buf', function()
		{
			var file = './test/rlutils/buffer.buf';
			var data = utils.parseParam(linker, 'file-buffer:'+file);
			expect(data.toString()).to.be('buf123\n');

			data = utils.parseParam(linker, 'file-buf:'+file);
			expect(data.toString()).to.be('buf123\n');
		});

		it('#file-jsonk', function()
		{
			var file = './test/rlutils/jsonk.jsonk';
			var data = utils.parseParam(linker, 'file:'+file);
			expect(data.toString()).to.be('bf123');

			data = utils.parseParam(linker, 'file-jsonk_:'+file);
			expect(data.toString()).to.be('bf123');
		});

		describe('#data type', function()
		{
			it('#base', function()
			{
				var data = utils.parseParam(linker, 'json:{"key": "value"}');
				expect(data.key).to.be('value');

				data = utils.parseParam(linker, 'buf:YmYxMjM=');
				expect(data.toString()).to.be('bf123');

				data = utils.parseParam(linker, 'buffer:YmYxMjM=');
				expect(data.toString()).to.be('bf123');

				data = utils.parseParam(linker, ' buffer:YmYxMjM=');
				expect(data.toString()).to.be('bf123');
			});

			it('#jsonk', function()
			{
				var now = Date.now();
				var data = utils.parseParam(linker, 'jsonk:{k:"Date", v:'+now+'}');
				expect(data.getTime()).to.be(now);

				data = utils.parseParam(linker, 'jsonk-:'
						+'{jsonk_data:{k:"Date", v:'+now+'}, parsers:"Date"}');
				expect(data.getTime()).to.be(now);

				data = utils.parseParam(linker, 'Date:'+now+'');
				expect(data.getTime()).to.be(now);

				data = utils.parseParam(linker, 'date:'+now+'');
				expect(data.getTime()).to.be(now);

				data = utils.parseParam(linker, 'jsonk-Date:'+now+'');
				expect(data.getTime()).to.be(now);

				// has no date parser
				data = utils.parseParam(linker, 'jsonk-date:'+now+'');
				expect(data).to.be.eql({k: 'date', v: ''+now});
			});


			it('#not_exists_parser', function()
			{
				var data = utils.parseParam(linker, 'not_exists_parser:xxx');
				expect(data).to.be('not_exists_parser:xxx');

				data = utils.parseParam(linker, ' not_exists_parser:xxx');
				expect(data).to.be(' not_exists_parser:xxx');
			});
		});
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


	it('#resolve', function()
	{
		expect(path.normalize(utils.resolve('~/xxx')))
			.to.be(path.normalize(process.env.HOME+'/xxx'));
		expect(path.normalize(utils.resolve('./xxx')))
			.to.be(path.normalize(process.cwd()+'/xxx'));
	});
});
