'use strict';

const pkghandler = require('./pkghandler');
module.exports = function methods(client) {
	const mod = pkghandler.initClient(client);
	if (mod) return Object.keys(mod);
};
