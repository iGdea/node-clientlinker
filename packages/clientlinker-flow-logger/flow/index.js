'use strict';

var logger = require('./logger');

module.exports = function(flow)
{
	flow.register(logger);
};
