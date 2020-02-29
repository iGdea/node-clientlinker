'use strict';

const localfile = require('./localfile');
const methods = require('./methods');

module.exports = function(flow) {
	flow.run = localfile;
	flow.methods = methods;
};
