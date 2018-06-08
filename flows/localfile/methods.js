"use strict";

var Promise	= require('bluebird');
var fs		= Promise.promisifyAll(require('fs'));

module.exports = methods;
function methods(client)
{
	var pathdir = client.options.localfile;
	if (!pathdir) return;

	return new Promise(function(resolve, reject)
		{
			fs.readdir(pathdir, function(err, dirs)
			{
				err ? reject(err) : resolve(dirs);
			});
		})
		.then(function(dirs)
		{
			return Promise.map(dirs, function(filename)
				{
					if (filename[0] == '.') return;

					var arr = filename.split('.');
					var extname = arr.pop();
					if (extname == 'json' || extname == 'js')
					{
						return fs.statAsync(pathdir+'/'+filename)
							.then(function(stats)
							{
								if (stats.isFile()) return arr.join('.');
							}, function(){});
					}
				},
				{
					concurrency: 5
				})
				.then(function(methods)
				{
					return methods.filter(function(method){return method});
				});
		});
}
