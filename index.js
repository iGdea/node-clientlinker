var Promise		= require('bluebird');
var _			= require('underscore');
var fs			=  require('fs');
var Linker		= require('./lib/main').Linker;
var debug		= require('debug')('client_linker');

var DEFAULT_FLOWS_PATH	= __dirname+'/flows/';

/**
 * [options]
 * 	flows
 * 	httpproxy
 * 	clients
 * 	clientDefaultOptions
 * 	localfileDir
 * 	pkghandlerDir
 */
exports = module.exports = ClientLinker;
function ClientLinker(options)
{
	options || (options = {});
	var clientDefaultOptions = options.clientDefaultOptions || (options.clientDefaultOptions = {});
	clientDefaultOptions.flows || (clientDefaultOptions.flows = options.flows);
	var linker = new Linker(options);

	if (options.flows)
	{
		options.flows.forEach(function(name)
		{
			if (exports.supportMiddlewares.indexOf(name) != -1)
			{
				linker.loadFlow(name, DEFAULT_FLOWS_PATH+name+'/'+name, module);
			}
		});
	}

	if (options.customFlows)
	{
		_.each(options.customFlows, function(handle, name)
		{
			linker.bindFlow(name, handle);
		});
	}

	linker.initConfig(options);

	// client options
	var clients = options.clients;
	if (clients)
	{
		_.each(clients, function(clientOptions, name)
		{
			clientOptions = _.extend({}, clientDefaultOptions, clientOptions);

			if (!clientOptions.flows && options.flows)
				clientOptions.flows = options.flows.slice();

			linker.addClient(name, clientOptions);
		});
	}

	linker.clients()
		.then(function(clients)
		{
			debug('init clients:%s', Object.keys(clients));
		});

	return linker;
};

exports.supportMiddlewares = fs.readdirSync(DEFAULT_FLOWS_PATH)
	.filter(function(b)
	{
		return b != '.' && b != '..' && b[0] != '.';
	});
