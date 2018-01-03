"use strict";

var Promise	= require('bluebird');
var debug	= require('debug')('clientlinker:localfile');
var fs		= require('fs');
var vm		= require('vm');

exports = module.exports = localfile;
exports.initConfig = require('./initConfig');
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

			new Promise(function(resolve, reject)
				{
					fs.readFile(fileInfo.file, {encoding: 'utf8'}, function(err, content)
					{
						err ? reject(err) : resolve(content);
					});
				})
				// 数据处理
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
	var tasks = extnames.map(function(extname)
		{
			return new Promise(function(resolve)
			{
				var thisFile = file+'.'+extname;
				fs.exists(thisFile, function(exists)
				{
					if (exists)
						resolve({extname: extname, file: thisFile});
					else
						resolve();
				});
			});
		});

	return Promise.all(tasks)
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
