"use strict";

var Promise		= require('bluebird');
var _			= require('underscore');
var fs			= require('fs');
var Linker		= require('./lib/linker').Linker;
var debug		= require('debug')('clientlinker');

var DEFAULT_FLOWS_PATH	= __dirname+'/flows/';

/**
 * [options]
 * 	flows
 * 	httpproxy
 * 	clients
 * 	defaults
 * 	localfileDir
 * 	pkghandlerDir
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
			if (exports.supportMiddlewares.indexOf(name) != -1)
			{
				linker.loadFlow(DEFAULT_FLOWS_PATH+name+'/'+name, module);
			}
		});
	}

	if (options.customFlows) linker.bindFlow(options.customFlows);
	// client options
	if (options.clients) linker.addClient(options.clients);
	linker.initConfig(options);

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
