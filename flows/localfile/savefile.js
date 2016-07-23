var Promise	= require('bluebird');
var fs		= require('fs');
var debug	= require('debug')('client_linker:localfile:save');
var mkdirp	= require('mkdirp');

module.exports = savefile;

function savefile(linker, localfile, methodName, err, data)
{
	if (!localfile || !methodName) return Promise.reject('NO_FILE_INFO');

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
					var file = localfile+'/'+methodName + '.json';
					var content = {result: err, data: data, CONST_VARS: linker.JSON.CONST_VARS};
					content = JSON.stringify(linker.JSON.stringify(content));

					fs.writeFile(file, content, {encoding: 'utf8'}, function(err)
					{
						err ? reject(err) : resolve();
					});
				});
		});
}
