"use strict";

var Promise			= require('bluebird');
var rlutils			= require('../bin/lib/rlutils');
var expect			= require('expect.js');
var ClientLinker	= require('../');
var path			= require('path');

rlutils.colors.enabled = false;

describe('#rlutils', function()
{
	describe('#parseParam', function()
	{
		var linker = ClientLinker()

		it('#base', function()
		{
			expect(rlutils.parseParam(linker, '')).to.be('');
			expect(rlutils.parseParam(linker, null)).to.be(null);
			expect(rlutils.parseParam(linker, 0)).to.be(0);

			expect(rlutils.parseParam(linker, '{"key": "value"}').key).to.be('value');
			expect(rlutils.parseParam(linker, '{key: "value"}').key).to.be('value');
			expect(rlutils.parseParam(linker, '{\'key\': "value"}').key).to.be('value');
			expect(rlutils.parseParam(linker, '({key: "value"})').key).to.be('value');
		});

		it('#jsonfile', function()
		{
			var file = './test/localfile/client/json.json';

			var data = rlutils.parseParam(linker, 'file-json:'+file);
			expect(data.data.string).to.be('string');

			data = rlutils.parseParam(linker, 'require:'+file);
			expect(data.data.string).to.be('string');
		});

		it('#jsfile', function()
		{
			var file = './test/localfile/client/js.js';

			var data = rlutils.parseParam(linker, 'file-js:'+file);
			expect(data.result).to.be.an(Error);
			expect(data.result.message).to.be('local file errmsg');
			expect(data.data.string).to.be('string');

			data = rlutils.parseParam(linker, 'require:'+file);
			expect(data.result).to.be.an(Error);
			expect(data.result.message).to.be('local file errmsg');
			expect(data.data.string).to.be('string');
		});

		it('#file-buf', function()
		{
			var file = './test/rlutils/buffer.buf';
			var data = rlutils.parseParam(linker, 'file-buffer:'+file);
			expect(data.toString()).to.be('buf123\n');

			data = rlutils.parseParam(linker, 'file-buf:'+file);
			expect(data.toString()).to.be('buf123\n');
		});

		it('#file-jsonk', function()
		{
			var file = './test/rlutils/jsonk.jsonk';
			var data = rlutils.parseParam(linker, 'file:'+file);
			expect(data.toString()).to.be('bf123');

			data = rlutils.parseParam(linker, 'file-jsonk_:'+file);
			expect(data.toString()).to.be('bf123');
		});

		describe('#data type', function()
		{
			it('#selfType', function()
			{
				var data = rlutils.parseParam(linker, 'json:{"key": "value"}');
				expect(data.key).to.be('value');

				data = rlutils.parseParam(linker, 'buf:YmYxMjM=');
				expect(data.toString()).to.be('bf123');

				data = rlutils.parseParam(linker, 'buffer:YmYxMjM=');
				expect(data.toString()).to.be('bf123');

				data = rlutils.parseParam(linker, ' buffer:YmYxMjM=');
				expect(data.toString()).to.be('bf123');
			});

			it('#baseType', function()
			{
				expect(rlutils.parseParam(linker, 'string:111'))
					.to.be.an('string').be('111');
				expect(rlutils.parseParam(linker, 'String:111'))
					.to.be.an('string').be('111');

				expect(rlutils.parseParam(linker, 'number:111'))
					.to.be.an('number').be(111);

				expect(rlutils.parseParam(linker, 'boolean:111'))
					.to.be.a('boolean').be(true);
				expect(rlutils.parseParam(linker, 'boolean:'))
					.to.be.a('boolean').be(false);
				expect(rlutils.parseParam(linker, 'boolean:0'))
					.to.be.a('boolean').be(false);
				expect(rlutils.parseParam(linker, 'boolean:00'))
					.to.be.a('boolean').be(true);
			});

			it('#jsonk', function()
			{
				var now = Date.now();
				var data = rlutils.parseParam(linker, 'jsonk:{k:"Date", v:'+now+'}');
				expect(data.getTime()).to.be(now);

				data = rlutils.parseParam(linker, 'new Date('+now+')');
				expect(data.getTime()).to.be(now);

				data = rlutils.parseParam(linker, 'object:new Date('+now+')');
				expect(data.getTime()).to.be(now);

				data = rlutils.parseParam(linker, 'jsonk-:'
						+'{jsonk_data:{k:"Date", v:'+now+'}, parsers:"Date"}');
				expect(data.getTime()).to.be(now);

				data = rlutils.parseParam(linker, 'Date:'+now+'');
				expect(data.getTime()).to.be(now);

				data = rlutils.parseParam(linker, 'date:'+now+'');
				expect(data.getTime()).to.be(now);

				data = rlutils.parseParam(linker, 'jsonk-Date:'+now+'');
				expect(data.getTime()).to.be(now);

				// has no date parser
				data = rlutils.parseParam(linker, 'jsonk-date:'+now+'');
				expect(data).to.be.eql(now);
			});


			it('#not_exists_parser', function()
			{
				var data = rlutils.parseParam(linker, 'not_exists_parser:xxx');
				expect(data).to.be('not_exists_parser:xxx');

				data = rlutils.parseParam(linker, ' not_exists_parser:xxx');
				expect(data).to.be(' not_exists_parser:xxx');

				data = rlutils.parseParam(linker, 'jsonk-not_exists_parser:xxx');
				expect(data).to.be('xxx');
			});
		});
	});


	it('#printObject', function()
	{
		expect(rlutils.printObject(new Error('errmsg')))
			.to.contain('Error: errmsg')
			.contain(__dirname)
			.contain(__filename);

		expect(rlutils.printObject('something')).to.be("'something'");
		expect(rlutils.printObject(undefined)).to.be('undefined');
		expect(rlutils.printObject(1)).to.be('1');
		expect(rlutils.printObject(null)).to.be('null');
		expect(rlutils.printObject({a:1,b:"b"})).to.be("{ a: 1, b: 'b' }");
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
				return rlutils.getAllMethods(list);
			})
			.then(function(allMethods)
			{
				expect(allMethods).to.not.be.empty();
				expect(allMethods[2]).to.be('client_its.method_callback_error_error');
				expect(allMethods.lines[2].index).to.be(2);

				expect(rlutils.parseAction('2', allMethods))
					.to.be('client_its.method_callback_data');
				expect(rlutils.parseAction('client_its.method_callback_data', allMethods))
					.to.be('client_its.method_callback_data');

				expect(rlutils.parseAction('', allMethods)).to.be(undefined);
				expect(rlutils.parseAction('1999', allMethods)).to.be(undefined);
				expect(rlutils.parseAction('client_not_exists.method', allMethods))
					.to.be(undefined);
				expect(rlutils.parseAction('client_its.not_exists_method', allMethods))
					.to.be(undefined);
			});
	});

	it('#methods width *', function()
	{
		var linker = ClientLinker(
			{
				flows: ['pkghandler', 'httpproxy'],
				pkghandlerDir: __dirname+'/pkghandler'
			});

		return linker.methods()
			.then(function(list)
			{
				return rlutils.getAllMethods(list);
			})
			.then(function(allMethods)
			{
				expect(rlutils.parseAction('', allMethods)).to.be(undefined);
				expect(rlutils.parseAction('1999', allMethods)).to.be(undefined);
				expect(rlutils.parseAction('client_not_exists.method', allMethods))
					.to.be(undefined);
				expect(rlutils.parseAction('client_its.not_exists_method', allMethods))
					.to.be('client_its.not_exists_method');
			});
	});


	it('#resolve', function()
	{
		expect(path.normalize(rlutils.resolve('~/xxx')))
			.to.be(path.normalize(rlutils.USER_HOME+'/xxx'));
		expect(path.normalize(rlutils.resolve('./xxx')))
			.to.be(path.normalize(process.cwd()+'/xxx'));
	});

	it('#str2obj', function()
	{
		var linker = ClientLinker();

		expect(rlutils.str2obj(linker, '{}')).to.be.a(Object);
		expect(rlutils.str2obj(linker, 'new Date')).to.be.a(Date);
		expect(rlutils.str2obj(linker, 'new Error')).to.be.a(Error);
	});
});
