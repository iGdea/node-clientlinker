const _ = require('lodash');
const Linker = require('./linker').Linker;
const debug = require('debug')('clientlinker');
const deprecate = require('depd')('clientlinker');

/**
 * [options]
 * 	flows
 * 	httpproxy
 * 	clients
 * 	defaults
 */
function clientlinker(options) {
	options || (options = {});
	const defaults =
		options.defaults ||
		options.clientDefaultOptions ||
		(options.defaults = {});
	!defaults.flows &&
		options.flows &&
		(defaults.flows = options.flows.slice());

	const linker = new Linker(options);
	// client options
	if (options.clients) {
		_.each(options.clients, (handler, name) => {
			linker.client(name, handler);
		});
	}

	if (options.customFlows) {
		deprecate('`options.customFlows` will not be supported.');

		_.each(options.customFlows, (handler, name) => {
			linker.flow(name, flow => {
				flow.run = handler;
				if (handler.methods) flow.methods = handler.methods;
			});
		});
	}

	linker.clients().then(clients => {
		debug('init clients:%s', Object.keys(clients));
	});

	return linker;
}

exports = module.exports = clientlinker;
