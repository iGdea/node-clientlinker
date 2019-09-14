'use strict';

var Promise	= require('bluebird');
var fs		= Promise.promisifyAll(require('fs'));
var vm		= require('vm');
var debug	= require('debug')('clientlinker-flow-localfile')

exports = module.exports = localfile;

function localfile(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	if (!options.localfile) return callback.next();

	var file = options.localfile+'/'+runtime.method;

	checkExists(file, ['js', 'json'])
		.then(function(exists)
		{
			var fileInfo = exists[0];
			if (!fileInfo) return callback.next();

			fs.readFileAsync(fileInfo.file, {encoding: 'utf8'})
				.then(function(content)
				{
					return parseContent(client.linker, content, fileInfo.extname);
				})
				.then(function(data)
				{
					if (!data)
						callback.reject(data);
					else if (data.result)
						callback.reject(data.result);
					else
						callback.resolve(data.data);
				},
				function(err)
				{
					callback.reject(err);
				});
		});
}


function checkExists(file, extnames)
{
	return Promise.map(extnames, function(extname)
		{
			var thisFile = file+'.'+extname;

			return fs.statAsync(thisFile)
				.then(function(stats)
				{
					if (stats.isFile()) return {extname: extname, file: thisFile};
				},
				function(err)
				{
					debug('file stat err, file: %s, err: %o', thisFile, err);
				});
		},
		{
			concurrency: 5
		})
		.then(function(exists)
		{
			return exists.filter(function(item)
			{
				return !!item;
			});
		});
}

exports.parseContent = parseContent;
function parseContent(linker, content, extname)
{
	if (extname == 'json')
	{
		return JSON.parse(content);
	}
	else
	{
		var data = {module:{exports:{}}};
		vm.runInNewContext(content, data);
		return data.module.exports;
	}
}
