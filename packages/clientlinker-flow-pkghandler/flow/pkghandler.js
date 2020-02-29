'use strict';

const debug = require('debug')('clientlinker-flow-pkghandler');

exports = module.exports = function pkghandler(runtime, callback) {
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
};

exports.initClient = initClient;
function initClient(client) {
	const options = client.options;
	if (!options.pkghandler) return;

	if (!client.pkghandlerModuleLoaded) {
		client.pkghandlerModule = require(options.pkghandler);
		client.pkghandlerModuleLoaded = true;
	}

	return client.pkghandlerModule;
}
