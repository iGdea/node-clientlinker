const Benchmark = require('benchmark');
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

const suite = new Benchmark.Suite();
suite
	.add('#native promise', deferred => {
		methodHandler()
			.then(() => deferred.resolve());
	}, { defer: true })
	.add('#native async', async (deferred) => {
		await methodHandler();
		deferred.resolve();
	}, { defer: true })
	.add('#clientlinker', deferred => {
		linker.run('client.method')
			.then(() => deferred.resolve());
	}, { defer: true })


	.add('#native promise2', deferred => {
		methodHandler()
			.then(methodHandler)
			.then(() => deferred.resolve());
	}, { defer: true })
	.add('#native async2', async (deferred) => {
		await methodHandler();
		await methodHandler();
		deferred.resolve();
	}, { defer: true })
	.add('#clientlinker2', deferred => {
		linker.run('client2.method')
			.then(() => deferred.resolve());
	}, { defer: true })


	.add('#native promise3', deferred => {
		Promise.all([
			methodHandler(),
			methodHandler()
		])
			.then(() => deferred.resolve());
	}, { defer: true })
	.add('#native async3', async (deferred) => {
		await Promise.all([
			methodHandler(),
			methodHandler()
		]);
		deferred.resolve();
	}, { defer: true })
	.add('#clientlinker3', deferred => {
		Promise.all([
			linker.run('client.method'),
			linker.run('client.method')
		])
			.then(() => deferred.resolve());
	}, { defer: true })


	.on('cycle', function(event) {
		console.log(String(event.target));
	})
	.on('complete', function() {
		console.log('Fastest is ' + this.filter('fastest').map('name'));
	})
	.run({ async: true });
