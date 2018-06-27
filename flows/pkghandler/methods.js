'use strict';

module.exports = methods;
var pkghandler = require('./pkghandler');

function methods(client)
{
	var mod = pkghandler.initClient(client);
	if (mod) return Object.keys(mod);
}
