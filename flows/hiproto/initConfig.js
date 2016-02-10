var fs		= require('fs');
var debug	= require('debug')('client_linker:hiproto');

module.exports = initConfig;
function initConfig(options)
{
	var linker = this;
	if (!options || !options.hiprotoDir) return;

	return new Promise(function(resolve, reject)
		{
			fs.readdir(options.hiprotoDir, function(err, dirs)
			{
				err ? reject(err) : resolve(dirs);
			});
		})
		.then(function(dirs)
		{
			var running = dirs.map(function(filename)
				{
					// 忽略. ..和影藏文件夹
					if (filename[0] == '.' || filename.substr(-4) != '.des') return;

					return new Promise(function(resolve)
						{
							var file = options.hiprotoDir+'/'+filename;

							fs.stat(file, function(err, stat)
							{
								if (err)
									conn.error('file stat err:%s, %o', file, err);
								else if (!stat.isFile())
									conn.log('is not file:%s', file);
								else
								{
									var clientOptions = _.extend({}, options.clientDefaultOptions);
									clientOptions.hiproto = file;
									var name = filename.substr(0, filename.length-4);
									// clientOptions.flows || (clientOptions.flows = ['hiproto']);
									debug('add hiproto client:%s %s', name, file);
									linker.add(name, clientOptions);
								}

								// 屏蔽错误
								resolve();
							});
						});
				});

			return Promise.all(running);
		});
}
