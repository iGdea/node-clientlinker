module.exports = methods;
var pkghandler = require('./pkghandler');

function methods(client)
{
	pkghandler.initClient(client);
	if (client.pkghandlerModule)
	{
		return Object.keys(client.pkghandlerModule);
	}
}
