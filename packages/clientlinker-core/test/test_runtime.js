'use strict';

const clientlinker = require('../');
const expect = require('expect.js');

describe('#runtime', function() {
	it('#runtime of retPromise', function() {
		const linker = clientlinker();
		linker.client('client', {});

		const retPromise = linker.run('client.method');
		const runtime = linker.lastRuntime;

		return retPromise.then(
			function() {
				expect().fail();
			},
			function() {
				expect(runtime).to.be.an('object');
			}
		);
	});

	it('#debug', function() {
		const linker = clientlinker({
			flows: ['custom1'],
			customFlows: {
				custom1: function(runtime) {
					runtime.debug('key1', 21);
				}
			},
			clients: {
				client: null
			}
		});

		const promise = linker.run('client.method');
		const runtime = linker.lastRuntime;

		return promise.then(function() {
			expect(runtime.debug('key1')).to.be(21);
			const alldata = runtime.debug();
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
		const linker = clientlinker({
			flows: ['custom1', 'custom2'],
			customFlows: {
				custom1: function(runtime, callback) {
					return callback.next();
				},
				custom2: function() {
				}
			},
			clients: {
				client: null
			}
		});

		const promise = linker.run(
			'client.method',
			'query',
			'body',
			'run_options'
		);
		const runtime = linker.lastRuntime;

		return promise.then(function() {
			const data = runtime.toJSON();
			const retry = data.retry;
			delete data.retry;
			expect(retry).to.be.an('array');
			expect(retry.length).to.be(1);

			const runned = retry[0].runned;
			delete retry[0].runned;
			expect(runned).to.be.an('array');
			expect(runned.length).to.be(2);
			expect(
				runned.map(function(item) {
					return item.name;
				})
			).to.be.eql(['custom1', 'custom2']);

			expect(retry[0]).to.be.eql({ started: true });

			expect(data).to.be.eql({
				action: 'client.method',
				query: 'query',
				body: 'body',
				options: 'run_options',
				client: 'client',
				env: { source: 'run' },
				debugData: {},
				started: true,
			});
		});
	});
});
