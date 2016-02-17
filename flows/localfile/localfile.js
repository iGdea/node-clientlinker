var debug	= require('debug')('client_linker:localfile');
var fs		= require('fs');
var vm		= require('vm');
var json	= require('../../lib/json');

exports = module.exports = localfile;
exports.initConfig = require('./initConfig');
exports.methods = require('./methods');

function localfile(runtime, callback)
{
	var client = runtime.client;
	var options = client.options;

	if (!options.localfile) return callback.next();

	var file = options.localfile+'/'+runtime.methodName;

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
					return parseContent(content, fileInfo.extname);
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
function parseContent(content, extname)
{
	if (extname == 'js')
	{
		return vm.runInNewContext(content, {module:{exports:{}}});
	}
	else if (extname == 'json')
	{
		var data = JSON.parse(content);

		if (data && data.CONST_VARS)
			data = json.parse(data, data.CONST_VARS);

		return data;
	}
}
