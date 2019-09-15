exports.run = require('./lib/run');
exports.methods = require('./lib/methods');

exports.flows = {
	confighandler: require('./flows/confighandler'),
	pkghandler: require('./flows/pkghandler'),
};
