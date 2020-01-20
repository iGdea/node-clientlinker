'use strict';

let httpproxy = require('./httpproxy');
let methods = require('./methods');

module.exports = function(flow)
{
	flow.run = httpproxy;
	flow.methods = methods;
};
