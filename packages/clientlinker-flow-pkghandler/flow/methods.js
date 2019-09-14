'use strict';

var pkghandler = require('./pkghandler');
module.exports = function methods(client)
{
	var mod = pkghandler.initClient(client);
	if (mod) return Object.keys(mod);
};
