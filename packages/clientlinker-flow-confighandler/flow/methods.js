'use strict';

module.exports = function methods(client) {
	const options = client.options;
	if (typeof options.confighandler == 'object') {
		return Object.keys(options.confighandler);
	}
};
