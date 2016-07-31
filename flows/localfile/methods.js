"use strict";

var Promise	= require('bluebird');
var fs		= require('fs');

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
			var promises = dirs.map(function(filename)
				{
					if (filename[0] != '.')
					{
						var arr = filename.split('.');
						var extname = arr.pop();
						if (extname == 'json' || extname == 'js')
						{
							return new Promise(function(resolve, reject)
							{
								fs.stat(pathdir+'/'+filename, function(err, stat)
								{
									if (err || !stat.isFile())
										resolve();
									else
										resolve(arr.join('.'));
								});
							});
						}
					}
				});

			return Promise.all(promises)
				.then(function(methods)
				{
					return methods.filter(function(method){return method});
				});
		});
}
