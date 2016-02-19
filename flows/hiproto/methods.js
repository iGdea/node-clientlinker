// var _		= require('underscore');
var hiproto	= require('./hiproto');

module.exports = methods;
function methods(client)
{
	return hiproto.initClient(client)
		.then(function(server)
		{
			var clientAlias = client.options.hiprotoClientAlias || client.name+'.'+client.name;
			return server.GetAllMethods(clientAlias);
		});
}
