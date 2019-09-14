'use strict';

var Promise			= require('bluebird');
var expect			= require('expect.js');
var clientlinker	= require('clientlinker');

describe('#localfile', function()
{
	it('#base', function()
	{
		var linker = clientlinker(
		{
			flows: ['localfile'],
			defaults:
			{
				opt: 'myOpt'
			},
			clients:
			{
				client:
				{
					localfile: __dirname+'/localfile/client'
				},
				client2:
				{
					localfile: __dirname+'/localfile/not_exsits'
				},
			}
		});

		linker.flow('localfile', require('../'));

		var promise1 = linker.run('client.js')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.be('local file errmsg')
				});

		var promise2 = linker.run('client.json')
			.then(function(data)
			{
				expect(data.string).to.be('string');
			});

		var promise3 = linker.methods()
			.then(function(map)
			{
				expect(map.client).to.be.an('object');
				expect(map.client.client.options.opt).to.be('myOpt');
				expect(map.client.client.options.localfile)
					.to.contain(__dirname);
				expect(map.client2.client.options.localfile)
					.to.contain('localfile/not_exsits');

				var methods = Object.keys(map.client.methods);
				expect(methods).to.eql(['js','json']);
			});

		return Promise.all([promise1, promise2, promise3]);
	});

	it('#localfile2', function()
	{
		var linker = clientlinker(
		{
			flows: ['localfile'],
			clients:
			{
				client:
				{
					localfile: __dirname+'/localfile/client'
				},
				client2:
				{
					localfile: __dirname+'/localfile/not_exsits'
				},
			}
		});

		linker.flow('localfile', require('../'));

		return linker.methods();
	});
});
