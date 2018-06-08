"use strict";

var Promise	= require('bluebird');
var fs		= Promise.promisifyAll(require('fs'));
var vm		= require('vm');

exports = module.exports = localfile;
exports.methods = require('./methods');

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
					else
						callback(data.result, data.data);
				},
				callback.reject);
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
				function(){});
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
