'use strict';

var pkghandler = require('./pkghandler');
var methods = require('./methods');

module.exports = function(flow)
{
	flow.register(pkghandler);
	flow.register('methods', methods);
};
