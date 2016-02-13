var _ = require('underscore');
var hiproto = require('./hiproto');

module.exports = methods;
function methods(client)
{
	return initClient(client)
		.then(function(server)
		{
			var clientAlias = client.options.hiprotoClientAlias || client.name;
			clientAlias += '.';
			var aliasIndex = clientAlias.length;

			var list = [];
			for(var methodName in server)
			{
				var handler = server[methodName];
				if (typeof handler == 'function'
					&& methodName.substr(0, aliasIndex) == clientAlias)
				{
					var shortMethodName = methodName.substr(aliasIndex);
					if (shortMethodName) list.push(shortMethodName);
				}
			}

			return list;
		});
}
