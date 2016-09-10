"use strict";

var Promise	= require('bluebird');
var _		= require('underscore');
var fs		= require('fs');
var debug	= require('debug')('clientlinker:pkghandler');

module.exports = initConfig;
function initConfig(options, linker)
{
	if (!options || !options.pkghandlerDir) return;

	return new Promise(function(resolve, reject)
		{
			fs.readdir(options.pkghandlerDir, function(err, dirs)
			{
				err ? reject(err) : resolve(dirs);
			});
		})
		.then(function(dirs)
		{
			var running = dirs.map(function(filename)
				{
					// 忽略. ..和隐藏文件夹
					if (filename[0] == '.' || filename.substr(-3) != '.js') return;

					return new Promise(function(resolve)
						{
							var file = options.pkghandlerDir+'/'+filename;

							fs.stat(file, function(err, stat)
							{
								if (err)
									debug('file stat err:%s, %o', file, err);
								else if (!stat.isFile())
									debug('is not file:%s', file);
								else
								{
									var name = filename.substr(0, filename.length-3);
									debug('add pkghandler client:%s %s', name, file);
									linker.addClient(name, {pkghandler: file}, true);
								}

								// 屏蔽错误
								resolve();
							});
						});
				});

			return Promise.all(running);
		});
}
