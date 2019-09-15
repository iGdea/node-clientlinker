'use strict';

var httpproxy = require('./httpproxy');
var methods = require('./methods');

module.exports = function(flow)
{
	flow.run = httpproxy;
	flow.methods = methods;
};
