var fs = require('fs');
var assert = require('assert');
var mkdirp = require('mkdirp');
var dir = __dirname+'/tmp/';
var savefile = require('../flows/localfile/savefile');
var parseContent = require('../flows/localfile/localfile').parseContent;

describe('savefile', function()
{
	before(function(done)
	{
		mkdirp(dir, done);
	});

	it('savefile', function(done)
	{
		var filename = process.pid+Math.random();
		savefile(dir, filename, new Error('errmsg123'), {data: 'data', buffer: new Buffer('buffer')})
			.then(function()
			{
				return new Promise(function(resolve, reject)
					{
						fs.readFile(dir+filename+'.json', {encoding: 'utf8'}, function(err, content)
						{
							err ? reject(err) : resolve(content);
						});
					});
			})
			.then(function(content)
			{
				var data = parseContent(content, 'json');
				assert.equal(data.result.message, 'errmsg123');
				assert.equal(data.data.data, 'data');
				assert(Buffer.isBuffer(data.data.buffer));
				assert.equal(data.data.buffer.toString(), 'buffer');
			})
			.then(done, done);

	});
});
