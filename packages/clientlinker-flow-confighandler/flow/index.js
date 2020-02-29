'use strict';

const confighandler = require('./confighandler');
const methods = require('./methods');

module.exports = function(flow) {
	flow.run = confighandler;
	flow.methods = methods;
};
