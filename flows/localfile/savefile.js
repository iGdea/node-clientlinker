var fs		= require('fs');
var debug	= require('debug')('client_linker:localfile:save');
var json	= require('../../lib/json');
var mkdirp;

try {
	mkdirp = require('mkdirp');
}
catch(e){}

module.exports = savefile;

function savefile(localfile, methodName, err, data)
{
	if (!localfile || !methodName) return Promise.reject('NO_FILE_INFO');

	return new Promise(function(resolve, reject)
		{
			if (!mkdirp) return resolve();
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
					var content = {result: err, data: data, CONST_VARS: json.CONST_VARS};
					content = JSON.stringify(json.stringify(content));

					fs.writeFile(file, content, {encoding: 'utf8'}, function(err)
					{
						err ? reject(err) : resolve();
					});
				});
		});
}
