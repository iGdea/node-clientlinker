'use strict';

let mysqlFlow = require('./mysql');

module.exports = function(flow)
{
	flow.run = mysqlFlow.flow;
	flow.methods = mysqlFlow.methods;
};
