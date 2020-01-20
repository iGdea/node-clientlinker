'use strict';

let pkghandler = require('./pkghandler');
module.exports = function methods(client) {
	let mod = pkghandler.initClient(client);
	if (mod) return Object.keys(mod);
};
