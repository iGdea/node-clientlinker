'use strict';

const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();
const clientlinker = require('../');

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

suite
	.add('#native promise', deferred => {
		new Promise(r => methodHandler().then(r))
			.then(deferred.resolve.bind(deferred));
	}, { defer: true })
	.add('#native promise2', deferred => {
		methodHandler().then(deferred.resolve.bind(deferred));
	}, { defer: true })

	.add('#clientlinker', deferred => {
		linker.run('client.method')
			.then(deferred.resolve.bind(deferred));
	}, { defer: true })
	.add('#clientlinker2', deferred => {
		linker.run('client2.method')
			.then(deferred.resolve.bind(deferred));
	}, { defer: true })

	.on('cycle', function(event) {
		console.log(String(event.target));
	})
	.on('complete', function() {
		console.log('Fastest is ' + this.filter('fastest').map('name'));
	})
	.run({ async: true });
