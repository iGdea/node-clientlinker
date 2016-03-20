var Promise	= require('bluebird');
var _		= require('underscore');
var fs		= require('fs');
var debug	= require('debug')('client_linker:pkghandler');

module.exports = initConfig;
function initConfig(options)
{
	var linker = this;
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
									conn.error('file stat err:%s, %o', file, err);
								else if (!stat.isFile())
									conn.log('is not file:%s', file);
								else
								{
									var clientOptions = _.extend({}, options.clientDefaultOptions);
									clientOptions.pkghandler = file;
									var name = filename.substr(0, filename.length-3);
									// clientOptions.flows || (clientOptions.flows = ['pkghandler']);
									debug('add pkghandler client:%s %s', name, file);
									linker.add(name, clientOptions, true);
								}

								// 屏蔽错误
								resolve();
							});
						});
				});

			return Promise.all(running);
		});
}
