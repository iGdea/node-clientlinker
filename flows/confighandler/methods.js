module.exports = methods;
function methods(client)
{
	var options = client.options;
	if (typeof options.confighandler == 'object')
	{
		return Object.keys(options.confighandler);
	}
}
