'use strict';

var localfile = require('./localfile');
var methods = require('./methods');

module.exports = function(flow)
{
	flow.register(localfile);
	flow.register('methods', methods);
};
