var ClientLinker = require('../');

var linker = ClientLinker(
	{
		flows: ['localfile', 'confighandler', 'pkghandler'],
		localfileDir: __dirname+'/localfile',
		pkghandlerDir: __dirname+'/pkghandler',
		clients: {
			client: {
				confighandler: require('./pkghandler/client')
			}
		},
		customFlows:
		{
			custom: function custom(runtime, callback)
			{
				callback(null, {respone: 'respone'});
			}
		}
	});

exports = module.exports = linker;
