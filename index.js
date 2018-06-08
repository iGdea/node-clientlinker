"use strict";

var Linker		= require('./lib/linker').Linker;
var debug		= require('debug')('clientlinker');
var STATIC		= require('./lib/static');


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

	if (options.flows)
	{
		options.flows.forEach(function(name)
		{
			if (STATIC.sysflows[name]) linker.loadFlow(name);
		});
	}

	if (options.customFlows) linker.bindFlow(options.customFlows);
	// client options
	if (options.clients) linker.addClient(options.clients);

	linker.clients()
		.then(function(clients)
		{
			debug('init clients:%s', Object.keys(clients));
		});

	return linker;
}
