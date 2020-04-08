'use strict';

const debug = require('debug')(
	'clientlinker-flow-confighandler-test:flows/confighandler'
);

module.exports = function(flow) {
	flow.run = confighandler;
	flow.methods = methods;
};

function methods(client) {
	const options = client.options;
	if (typeof options.confighandler == 'object') {
		return Object.keys(options.confighandler);
	}
}

function confighandler(runtime, callback) {
	const client = runtime.client;
	const options = client.options;
	if (!options.confighandler) return callback.next();

	const handler = options.confighandler[runtime.method];

	if (typeof handler == 'function') {
		if (typeof callback == 'object') callback = callback.toFuncCallback();
		return handler(runtime.query, runtime.body, callback, runtime.options);
	} else {
		debug('config no handler:%s', runtime.method);
		return callback.next();
	}
}
