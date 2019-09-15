'use strict';

var localfile = require('./localfile');
var methods = require('./methods');

module.exports = function(flow)
{
	flow.run = localfile;
	flow.methods = methods;
};
