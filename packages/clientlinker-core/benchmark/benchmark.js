'use strict';

const Promise = require('bluebird');
const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();
const clientlinker = require('../');

function methodHandler(query, body, callback) {
	callback && callback(null);
}

const linker = clientlinker({
	flows: ['confighandler'],
	clients: {
		client: {
			confighandler: {
				method: methodHandler
			}
		}
	}
});

linker.flow(
	'confighandler',
	require('clientlinker-flow-confighandler-test').flows.confighandler
);

suite
	.add(
		'#native promise',
		function(deferred) {
			new Promise(function(resolve) {
				methodHandler(
					null,
					null,
					resolve
				);
			}).then(deferred.resolve.bind(deferred));
		},
		{ defer: true }
	)

	.add(
		'#clientlinker',
		function(deferred) {
			linker.run('client.method')
				.then(deferred.resolve.bind(deferred));
		},
		{ defer: true }
	)

	.on('cycle', function(event) {
		console.log(String(event.target));
	})
	.on('complete', function() {
		console.log('Fastest is ' + this.filter('fastest').map('name'));
	})
	.run({ async: true });
