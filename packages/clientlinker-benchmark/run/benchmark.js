const linker = require('../lib/linker');
const Benchmark = require('benchmark');

function methodHandler() {
	return Promise.resolve();
}

const onlyClientlinker = process.argv.indexOf('--only-clientlinker') !== -1;

const suite = new Benchmark.Suite();
suite.on('cycle', function(event) {
	console.log(String(event.target));
});

if (!onlyClientlinker) {
	suite.on('complete', function() {
		console.log('Fastest is ' + this.filter('fastest').map('name'));
	});
}


if (!onlyClientlinker) {
	suite
		.add('#native promise', deferred => {
			methodHandler()
				.then(() => deferred.resolve());
		}, { defer: true })
		.add('#native async', async (deferred) => {
			await methodHandler();
			deferred.resolve();
		}, { defer: true });
}

suite.add('#clientlinker', deferred => {
	linker.run('client.method')
		.then(() => deferred.resolve());
}, { defer: true });


if (!onlyClientlinker) {
	suite
		.add('#native promise2', deferred => {
			methodHandler()
				.then(methodHandler)
				.then(() => deferred.resolve());
		}, { defer: true })
		.add('#native async2', async (deferred) => {
			await methodHandler();
			await methodHandler();
			deferred.resolve();
		}, { defer: true });
}

suite.add('#clientlinker2', deferred => {
	linker.run('client2.method')
		.then(() => deferred.resolve());
}, { defer: true });


if (!onlyClientlinker) {
	suite
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
		}, { defer: true });
}

suite.add('#clientlinker3', deferred => {
	Promise.all([
		linker.run('client.method'),
		linker.run('client.method')
	])
		.then(() => deferred.resolve());
}, { defer: true });


suite.run({ async: true });
