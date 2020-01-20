'use strict';

let confighandler = require('./confighandler');
let methods = require('./methods');

module.exports = function(flow) {
	flow.run = confighandler;
	flow.methods = methods;
};
