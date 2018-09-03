'use strict';

var _			= require('lodash');
var Linker		= require('./lib/linker').Linker;
var debug		= require('debug')('clientlinker');
var deprecate	= require('depd')('clientlinker');


/**
 * [options]
 * 	flows
 * 	httpproxy
 * 	clients
 * 	defaults
 */
exports = module.exports = ClientLinker;
function ClientLinker(options)
{
	options || (options = {});
	var defaults = options.defaults || options.clientDefaultOptions || (options.defaults = {});
	!defaults.flows && options.flows && (defaults.flows = options.flows.slice());

	var linker = new Linker(options);
	// client options
	if (options.clients)
	{
		_.each(options.clients, function(handler, name)
		{
			linker.client(name, handler);
		});
	}

	if (options.customFlows)
	{
		deprecate('`options.customFlows` will not be supported.');

		_.each(options.customFlows, function(handler, name)
		{
			linker.flow(name, function(flow)
			{
				flow.register(handler);
				if (handler.methods)
				{
					flow.register('methods', handler.methods);
				}
			});
		});
	}

	linker.clients()
		.then(function(clients)
		{
			debug('init clients:%s', Object.keys(clients));
		});

	return linker;
}
