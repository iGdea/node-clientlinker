'use strict';

var mysqlFlow = require('./mysql');

module.exports = function(flow)
{
	flow.register(mysqlFlow.flow);
	flow.register('methods', mysqlFlow.methods);
};
