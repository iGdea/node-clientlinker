var hiproto	= require('./hiproto');

module.exports = methods;
function methods(client)
{
	return hiproto.initClient(client)
		.then(function(server)
		{
			return server.GetAllMethods(client.options.hiprotoClientAlias);
		});
}
