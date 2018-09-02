'use strict';

var _			= require('lodash');
var Linker		= require('./lib/linker').Linker;
var debug		= require('debug')('clientlinker');


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

	linker.clients()
		.then(function(clients)
		{
			debug('init clients:%s', Object.keys(clients));
		});

	return linker;
}
