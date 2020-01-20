'use strict';

let pkghandler = require('./pkghandler');
let methods = require('./methods');

module.exports = function(flow) {
	flow.run = pkghandler;
	flow.methods = methods;
};
