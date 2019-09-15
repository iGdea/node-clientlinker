'use strict';

var pkghandler = require('./pkghandler');
var methods = require('./methods');

module.exports = function(flow)
{
	flow.run = pkghandler;
	flow.methods = methods;
};
