'use strict';

const Promise = require('bluebird');
const clientlinker = require('../');
const expect = require('expect.js');

describe('#base', function() {
	it('#addClient', function() {
		const linker = clientlinker();

		linker.client('client1', {});
		return linker
			.clients()
			.then(function(clients) {
				expect(Object.keys(clients).length).to.be(1);
			})
			.then(function() {
				linker.client('client2', {});
				linker.client('client3', {});
				return linker.clients();
			})
			.then(function(clients) {
				expect(Object.keys(clients).length).to.be(3);
			});
	});

	describe('#bindFlow', function() {
		it('#function', function() {
			const linker = clientlinker();
			linker.flow('flow1', flow => flow.run = function() {});
			expect(Object.keys(linker.flows).length).to.be(1);
		});

		it('#same', function() {
			const linker = clientlinker();
			linker.flow('flow1', flow => flow.run = function() {});
			linker.flow('flow1', flow => flow.run = function() {});
			expect(Object.keys(linker.flows).length).to.be(1);
		});

	});

	it('#custom flow', function() {
		const linker = clientlinker({
			flows: ['custom', 'custom2'],
			customFlows: {
				custom: function custom() {}
			}
		});

		expect(Object.keys(linker.flows).length).to.be(1);
	});

	it('#pkg clients', function() {
		const linker1 = clientlinker({
			flows: ['pkghandler'],
			clients: {
				client1: null
			}
		});

		const linker2 = clientlinker({
			flows: ['pkghandler'],
			clients: {
				client1: null,
				client_its: {
					pkghandler: 'clientlinker-flow-pkghandler/lib/methods'
				}
			}
		});

		linker1.flow(
			'pkghandler',
			require('clientlinker-flow-confighandler-test').flows.pkghandler
		);
		linker2.flow(
			'pkghandler',
			require('clientlinker-flow-confighandler-test').flows.pkghandler
		);

		const promise1 = linker1.clients().then(function(clients) {
			const list = Object.keys(clients);
			expect(list.length).to.be(1);
			expect(list[0]).to.be('client1');
		});

		const promise2 = linker2.clients().then(function(clients) {
			const list = Object.keys(clients);
			expect(list.length).to.be(2);
		});

		return Promise.all([promise1, promise2]);
	});

	it('#client options override', function() {
		const linker = clientlinker({
			flows: ['confighandler', 'pkghandler'],
			clients: {
				client: {
					flows: ['pkghandler']
				},
				client_its: {
					pkghandler: __dirname + '/pkghandler/client_its'
				}
			}
		});

		return linker.clients().then(function(clients) {
			expect(clients.client.options.flows[0]).to.be('pkghandler');
		});
	});

	it('#clientrun', function(done) {
		// this.timeout(60*1000);
		let runned = false;
		const linker = clientlinker({
			flows: ['custom'],
			customFlows: {
				custom: function custom(runtime, callback) {
					runned = true;
					callback.callback();
				}
			}
		});

		linker.client('client', { flows: ['custom'] });
		linker.run('client.xxxx', null, null, function(err) {
			expect(err).to.be(null);
			expect(runned).to.be.ok();
			done();
		});
	});

	it('#getRunnedFlowByName', function() {
		const linker = clientlinker({
			flows: ['pkghandler', 'confighandler'],
			clients: {
				client: {
					confighandler: {
						method: function() {
							return Promise.resolve('heihei');
						}
					}
				}
			}
		});

		linker.flow(
			'pkghandler',
			require('clientlinker-flow-confighandler-test').flows.pkghandler
		);
		linker.flow(
			'confighandler',
			require('clientlinker-flow-confighandler-test').flows.confighandler
		);

		const retPromise = linker.run('client.method');
		const runtime = linker.lastRuntime;
		return retPromise.then(function(data) {
			const flowsRun = runtime.retry[0];
			const configCallback = flowsRun.getFlowRuntime('confighandler');
			const configCallback2 = flowsRun.runned[1];

			expect(configCallback.flow.name).to.be('confighandler');
			expect(configCallback.flow).to.eql(configCallback2.flow);

			return configCallback.promise.then(function(data2) {
				expect(data2).to.be(data);
				expect(data2).to.be('heihei');
			});
		});
	});
});
