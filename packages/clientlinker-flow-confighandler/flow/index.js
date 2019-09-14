'use strict';

var confighandler = require('./confighandler');
var methods = require('./methods');

module.exports = function(flow)
{
	flow.register(confighandler);
	flow.register('methods', methods);
};
