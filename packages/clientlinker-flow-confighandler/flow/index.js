'use strict';

var confighandler = require('./confighandler');
var methods = require('./methods');

module.exports = function(flow)
{
	flow.run = confighandler;
	flow.methods = methods;
};
