'use strict';

const debug = require('debug')(
	'clientlinker-flow-confighandler:flows/pkghandler'
);

module.exports = function(flow) {
	flow.run = pkghandler;
	flow.methods = methods;
};

function pkghandler(runtime, callback) {
	const client = runtime.client;
	const mod = initClient(client);

	if (!mod) return callback.next();
	const handler = mod[runtime.method];

	if (handler) {
		if (typeof callback == 'object') callback = callback.toFuncCallback();
		return handler(runtime.query, runtime.body, callback, runtime.options);
	} else {
		debug('pkg no handler:%s', runtime.method);
		return callback.next();
	}
}

function methods(client) {
	const mod = initClient(client);
	if (mod) return Object.keys(mod);
}

function initClient(client) {
	const options = client.options;
	if (!options.pkghandler) return;

	if (!client.pkghandlerModuleLoaded) {
		client.pkghandlerModule = require(options.pkghandler);
		client.pkghandlerModuleLoaded = true;
	}

	return client.pkghandlerModule;
}
