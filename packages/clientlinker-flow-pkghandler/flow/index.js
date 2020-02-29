'use strict';

const pkghandler = require('./pkghandler');
const methods = require('./methods');

module.exports = function(flow) {
	flow.run = pkghandler;
	flow.methods = methods;
};
