"use strict";

var Promise	= require('bluebird');
var _		= require('underscore');
var fs		= require('fs');
var debug	= require('debug')('client_linker:localfile');

module.exports = initConfig;
function initConfig(options, linker)
{
	if (!options || !options.localfileDir) return;

	return new Promise(function(resolve, reject)
		{
			fs.readdir(options.localfileDir, function(err, dirs)
			{
				err ? reject(err) : resolve(dirs);
			});
		})
		.then(function(dirs)
		{
			var running = dirs.map(function(pathname)
				{
					// 忽略. ..和隐藏的文件夹
					if (pathname[0] == '.') return;

					return new Promise(function(resolve)
						{
							var path = options.localfileDir+'/'+pathname;
							fs.stat(path, function(err, stat)
							{
								if (err)
									conn.error('path stat err:%s, %o', path, err);
								else if (!stat.isDirectory())
									conn.log('is not path:%s', path);
								else
								{
									debug('add localfile client:%s %s', pathname, path);
									linker.addClient(pathname, {localfile: path}, true);
								}

								// 屏蔽错误
								resolve();
							});
						});

				});

			return Promise.all(running);
		});
}
