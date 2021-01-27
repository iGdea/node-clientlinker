const debug = require('debug')('clientlinker-flow-confighandler');

module.exports = function confighandler(runtime, callback) {
	const client = runtime.client;
	const options = client.options;
	if (!options.confighandler) return callback.next();

	const handler = options.confighandler[runtime.method];

	if (typeof handler == 'function') {
		return handler(runtime.query, runtime.body, runtime.options);
	} else {
		debug('config no handler:%s', runtime.method);
		return callback.next();
	}
};
