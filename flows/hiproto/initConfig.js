var Promise	= require('bluebird');
var _		= require('underscore');
var fs		= require('fs');
var debug	= require('debug')('client_linker:hiproto');

var FilenameReg = /^([^\.\-\s]+)(?:-((?:[^\.\-\s]+)\.(?:[^\.\-\s]+)))?\.desc$/i;

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
					var filenameInfo;

					// 忽略. ..和隐藏文件夹
					if (filename[0] != '.')
						filenameInfo = filename.match(FilenameReg);

					if (!filenameInfo) return;

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
									var clientName = filenameInfo[1];
									var clientOptions = _.extend({}, options.clientDefaultOptions);
									clientOptions.hiproto = file;
									clientOptions.hiprotoClientAlias = filenameInfo[2] || clientName+'.'+clientName;

									// clientOptions.flows || (clientOptions.flows = ['hiproto']);
									debug('add hiproto client:%s %s', clientName, file);
									linker.addClient(clientName, clientOptions, true);
								}

								// 屏蔽错误
								resolve();
							});
						});
				});

			return Promise.all(running);
		});
}
