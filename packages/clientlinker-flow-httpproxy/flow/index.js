'use strict';

const httpproxy = require('./httpproxy');
const methods = require('./methods');

module.exports = function(flow) {
	flow.run = httpproxy;
	flow.methods = methods;
};
