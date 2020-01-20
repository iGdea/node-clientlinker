'use strict';

let localfile = require('./localfile');
let methods = require('./methods');

module.exports = function(flow)
{
	flow.run = localfile;
	flow.methods = methods;
};
