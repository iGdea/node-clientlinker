'use strict';

const Promise = require('bluebird');
const clientlinker = require('../');
const expect = require('expect.js');
const debug = require('debug')('clientlinker:test_domain');

describe('#domain', function() {
	it('#callback', function(done) {
		const linker = clientlinker({
			flows: ['confighandler'],
			clients: {
				client: {
					confighandler: {
						method: function() {
							return Promise.resolve();
						}
					}
				}
			}
		});

		linker.flow(
			'confighandler',
			require('clientlinker-flow-confighandler-test').flows.confighandler
		);

		const domain = require('domain');
		const dm = domain.create();

		dm.on('error', function(err) {
			debug('domain err:%s', err.stack);
			let mainErr;
			try {
				expect(err).to.be(333);
			} catch (err) {
				mainErr = err;
			}

			// domian onerror之后还会保留 process.domain
			dm.exit();
			done(mainErr);
		});
		dm.run(function() {
			linker.run('client.method', null, null, function(err) {
				expect(err).to.be(null);
				throw 333;
			});
		});
	});

	it('#promise', function() {
		const linker = clientlinker({
			flows: ['confighandler'],
			clients: {
				client: {
					confighandler: {
						method1: function() {
							return Promise.resolve(111);
						},
						method2: function() {
							return Promise.resolve(222);
						},
						method3: function() {
							return Promise.reject(333);
						}
					}
				}
			}
		});

		linker.flow(
			'confighandler',
			require('clientlinker-flow-confighandler-test').flows.confighandler
		);

		const domain = require('domain');
		const dm = domain.create();
		dm._mark_assert = 234;

		return new Promise(function(resolve, reject) {
			dm.on('error', reject);
			dm.run(function() {
				linker
					.run('client.method1')
					.then(function(data) {
						expect(domain.active).to.be.ok();
						expect(domain.active._mark_assert).to.be(234);
						expect(data).to.be(111);
						return linker.run('client.method2');
					})
					.then(function(data) {
						expect(domain.active).to.be.ok();
						expect(domain.active._mark_assert).to.be(234);
						expect(data).to.be(222);
						const promise = linker.run('client.method3');
						promise.catch(function(err) {
							expect(err).to.be(333);
							resolve();
						});
						return promise;
					});
			});
		});
	});

	it('#addon', function() {
		let addon;
		try {
			addon = require('nan-async-example');
		} catch (err) {
			debug('load addon err: %s', err.stack);
			return Promise.resolve();
		}

		const linker = clientlinker({
			flows: ['confighandler'],
			clients: {
				client: {
					confighandler: {
						callback: function(query, body, callback) {
							addon(callback);
						},
						resolve: function() {
							return new Promise(function(resolve) {
								addon(function(err, data) {
									resolve(data);
								});
							});
						}
					}
				}
			}
		});

		linker.flow(
			'confighandler',
			require('clientlinker-flow-confighandler-test').flows.confighandler
		);

		const domain = require('domain');
		const dm = domain.create();
		dm._mark_assert = 222;

		const promise1 = dm.run(function() {
			let promise11;
			const promise12 = new Promise(function(resolve) {
				promise11 = linker
					.run('client.callback', null, null, function(err, data) {
						expect(data).to.be('hello world');
						expect(domain.active._mark_assert).to.be(222);
						resolve();
					})
					.then(function(data) {
						expect(data).to.be('hello world');
						expect(domain.active._mark_assert).to.be(222);
					});
			});

			return Promise.all([promise11, promise12]);
		});

		const dm2 = domain.create();
		dm2._mark_assert = 333;

		const promise2 = dm2.run(function() {
			return linker.run('client.resolve').then(function(data) {
				expect(data).to.be('hello world');
				expect(domain.active._mark_assert).to.be(333);
			});
		});

		return Promise.all([promise1, promise2]);
	});
});
