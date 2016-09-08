"use strict";

var Promise	= require('bluebird');
var fs		= require('fs');
var debug	= require('debug')('client_linker:localfile:save');
var mkdirp	= require('mkdirp');

module.exports = savefile;

function savefile(linker, localfile, method, err, data)
{
	if (!localfile || !method) return Promise.reject('NO_FILE_INFO');

	return new Promise(function(resolve, reject)
		{
			mkdirp(localfile, function(err)
			{
				err ? reject(err) : resolve();
			});
		})
		.then(function()
		{
			return new Promise(function(resolve, reject)
				{
					var file = localfile+'/'+method + '.jsonk';
					var content = {result: err, data: data};
					content = linker.JSON.stringifyToString(content);

					fs.writeFile(file, content, {encoding: 'utf8'}, function(err)
					{
						err ? reject(err) : resolve();
					});
				});
		});
}
