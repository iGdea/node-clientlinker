const clientlinker = require('../');
const expect = require('expect.js');
const debug = require('debug')('clientlinker:test_domain');

describe('#domain', () => {
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

});
