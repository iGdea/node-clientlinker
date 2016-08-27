"use strict";

var Promise			= require('bluebird');
var fs				= require('fs');
var expect			= require('expect.js');
var mkdirp			= require('mkdirp');
var savefile		= require('../flows/localfile/savefile');
var parseContent	= require('../flows/localfile/localfile').parseContent;
var ClientLinker	= require('../');
var DIR				= __dirname+'/tmp/';

describe('#savefile', function()
{
	before(function(done)
	{
		mkdirp(DIR, done);
	});

	it('#savefile', function(done)
	{
		var filename = process.pid+Math.random();
		var linker = new ClientLinker;
		savefile(linker, DIR, filename, new Error('errmsg123'), {data: 'data', buffer: new Buffer('buffer')})
			.then(function()
			{
				return new Promise(function(resolve, reject)
					{
						fs.readFile(DIR+filename+'.json', {encoding: 'utf8'}, function(err, content)
						{
							err ? reject(err) : resolve(content);
						});
					});
			})
			.then(function(content)
			{
				var data = parseContent(linker, content, 'json');
				expect(data.result).to.be.an(Error);
				expect(data.result.message).to.be('errmsg123');
				expect(data.data.data).to.be('data');
				expect(data.data.buffer).to.be.a(Buffer);
				expect(data.data.buffer.toString()).to.be('buffer');
			})
			.then(done, done);

	});
});
