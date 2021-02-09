/* global clientlinker */

function methodHandler() {
	return Promise.resolve();
}

const linker = clientlinker({
	customFlows: {
		next(runtime, callback) {
			return callback.next();
		}
	},
	clients: {
		client: {
			flows: ['confighandler'],
			confighandler: {
				method: methodHandler
			}
		},
		client2: {
			flows: ['next', 'confighandler'],
			confighandler: {
				method: methodHandler
			}
		},
	}
});

linker.flow(
	'confighandler',
	require('clientlinker-flow-confighandler-test').flows.confighandler
);

module.exports = linker;
