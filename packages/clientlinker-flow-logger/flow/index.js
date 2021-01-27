const logger = require('./logger');

module.exports = function(flow) {
	flow.run = logger;
};
