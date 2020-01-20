'use strict';

let Promise = require('bluebird');
let clientlinker = require('../');
let expect = require('expect.js');

describe('#runtime', function() {
	it('#runtime of retPromise', function() {
		let linker = clientlinker();
		linker.addClient('client');

		let retPromise = linker.run('client.method');
		let runtime = linker.lastRuntime;

		return retPromise.then(
			function() {
				expect().fail();
			},
			function() {
				expect(runtime).to.be.an('object');
				expect(runtime.navigationStart).to.be.a('number');
			}
		);
	});

	it('#env of runtime', function() {
		let linker = clientlinker();
		linker.addClient('client');

		let retPromise1 = linker.run('client.method');
		let runtime1 = linker.lastRuntime;
		let promise1 = retPromise1.then(
			function() {
				expect().fail();
			},
			function() {
				expect(runtime1.env.source).to.be('run');
			}
		);

		let retPromise2 = linker.runInShell('client.method');
		let runtime2 = linker.lastRuntime;
		let promise2 = retPromise2.then(
			function() {
				expect().fail();
			},
			function() {
				expect(runtime2.env.source).to.be('shell');
			}
		);

		return Promise.all([promise1, promise2]);
	});

	it('#timing', function() {
		let linker = clientlinker({
			flows: ['assertHandler', 'custom1', 'custom2'],
			customFlows: {
				custom1: function custom1(runtime, callback) {
					setTimeout(callback.nextAndResolve.bind(callback), 100);
				},
				custom2: function custom2(runtime, callback) {
					setTimeout(callback.callback.bind(callback), 100);
				},
				assertHandler: function assertHandler(runtime, callback) {
					let lastRunnerTiming = runtime.lastFlow().timing;
					let timing = runtime.timing;

					expect(lastRunnerTiming.start).to.be.above(
						runtime.navigationStart - 1
					);
					expect(
						lastRunnerTiming.start - runtime.navigationStart
					).to.be.below(10);

					expect(lastRunnerTiming.start).to.be(timing.flowsStart);

					return callback.next();
				}
			},
			clients: {
				client: {
					method: null
				}
			}
		});

		let retPromise = linker.run('client.method');
		let runtime = linker.lastRuntime;

		return retPromise.then(function() {
			let timing = runtime.timing;
			let lastRunnerTiming = runtime.lastFlow().timing;

			expect(timing.flowsEnd).to.be(lastRunnerTiming.end);
		});
	});

	it('#debug', function() {
		let linker = clientlinker({
			flows: ['custom1'],
			customFlows: {
				custom1: function(runtime, callback) {
					runtime.debug('key1', 21);
					callback.resolve();
				}
			},
			clients: {
				client: null
			}
		});

		let promise = linker.run('client.method');
		let runtime = linker.lastRuntime;

		return promise.then(function() {
			expect(runtime.debug('key1')).to.be(21);
			let alldata = runtime.debug();
			expect(Object.keys(alldata)).to.eql(['key1']);
			expect(alldata.key1).to.be.an('array');
			expect(alldata.key1.length).to.be(1);
			expect(alldata.key1[0].toJSON()).to.eql({
				retry: 1,
				value: 21,
				flow: 'custom1'
			});
		});
	});

	it('#toJSON', function() {
		let linker = clientlinker({
			flows: ['custom1', 'custom2'],
			customFlows: {
				custom1: function(runtime, callback) {
					return callback.next();
				},
				custom2: function(runtime, callback) {
					callback.resolve();
				}
			},
			clients: {
				client: null
			}
		});

		let promise = linker.run(
			'client.method',
			'query',
			'body',
			'run_options'
		);
		let runtime = linker.lastRuntime;

		return promise.then(function() {
			let data = runtime.toJSON();
			expect(data.navigationStart).to.be.a('number');
			delete data.navigationStart;

			let timing = data.timing;
			delete data.timing;
			expect(Object.keys(timing)).to.eql(['startTime', 'endTime']);
			expect(timing.startTime).to.be.a('number');
			expect(timing.endTime).to.be.a('number');

			let retry = data.retry;
			delete data.retry;
			expect(retry).to.be.an('array');
			expect(retry.length).to.be(1);

			timing = retry[0].timing;
			delete retry[0].timing;
			expect(Object.keys(timing)).to.eql(['startTime', 'endTime']);
			expect(timing.startTime).to.be.a('number');
			expect(timing.endTime).to.be.a('number');

			let runned = retry[0].runned;
			delete retry[0].runned;
			expect(runned).to.be.an('array');
			expect(runned.length).to.be(2);
			expect(runned[0].startTime).to.be.a('number');
			expect(runned[0].endTime).to.be.a('number');
			expect(
				runned.map(function(item) {
					return item.name;
				})
			).to.be.eql(['custom1', 'custom2']);

			expect(retry[0]).to.be.eql({ started: true, finished: true });

			expect(data).to.be.eql({
				action: 'client.method',
				query: 'query',
				body: 'body',
				options: 'run_options',
				client: 'client',
				env: { source: 'run' },
				debugData: {},
				started: true,
				finished: true
			});
		});
	});
});
