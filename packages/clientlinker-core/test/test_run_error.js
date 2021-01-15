'use strict';

const clientlinker = require('../');
const expect = require('expect.js');
const debug = require('debug')('clientlinker:test_run_error');

describe('#run_error', function() {
	it('#flow run Error', function() {
		const linker = clientlinker({
			flows: ['confighandler'],
			clients: {
				client: {
					confighandler: {
						method: function() {
							throw 333;
						},
						method2: function() {
							throw new Error('errmsg');
						}
					}
				},
				client2: {
					flows: []
				}
			}
		});

		linker.flow(
			'confighandler',
			require('clientlinker-flow-confighandler-test').flows.confighandler
		);

		const promise2 = linker.run('client.method').then(
			function() {
				expect().fail();
			},
			function(err) {
				expect(err).to.be(333);
			}
		);

		const promise3 = linker.run('client.not_exit_method').then(
			function() {
				expect().fail();
			},
			function(err) {
				debug('err: %s', err.stack);
				expect(err.message).to.contain('CLIENTLINKER:NotFound');
				expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
				// expect(err.CLIENTLINKER_ACTION).to.be('client.not_exit_method');
				// expect(err.CLIENTLINKER_CLIENT).to.be('client');
			}
		);

		const promise4 = linker.run('client1.method').then(
			function() {
				expect().fail();
			},
			function(err) {
				debug('err: %s', err.stack);
				expect(err.message).to.contain('CLIENTLINKER:NotFound');
				expect(err.CLIENTLINKER_TYPE).to.be('NO CLIENT');
				// expect(err.CLIENTLINKER_ACTION).to.be('client1.method');
			}
		);

		const promise5 = linker.run('client2.method').then(
			function() {
				expect().fail();
			},
			function(err) {
				debug('err: %s', err.stack);
				expect(err.message).to.contain('CLIENTLINKER:NotFound');
				expect(err.CLIENTLINKER_TYPE).to.be('CLIENT NO FLOWS');
				// expect(err.CLIENTLINKER_ACTION).to.be('client2.method');
				// expect(err.CLIENTLINKER_CLIENT).to.be('client2');
			}
		);

		const promise6 = linker.run('client.not_exit_method').then(
			function() {
				expect().fail();
			},
			function(err) {
				debug('err: %s', err.stack);
				expect(err).to.be.an(Error);
				expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
			}
		);

		const promise7 = linker.run('client.method2').then(
			function() {
				expect().fail();
			},
			function(err) {
				expect(err).to.be.an(Error);
				expect(err.message).to.be('errmsg');
			}
		);

		return Promise.all([
			promise2,
			promise3,
			promise4,
			promise5,
			promise6,
			promise7
		]);
	});

	it('#not exportErrorInfo', function() {
		const linker = clientlinker({
			flows: ['confighandler'],
			defaults: {
				exportErrorInfo: false
			},
			clients: {
				client: {
					confighandler: {
						method: function() {
							throw new Error('errmsg');
						}
					}
				}
			}
		});

		linker.flow(
			'confighandler',
			require('clientlinker-flow-confighandler-test').flows.confighandler
		);

		return linker.run('client.method').then(
			function() {
				expect().fail();
			},
			function(err) {
				expect(err).to.be.an(Error);
				expect(err.message).to.be('errmsg');
				expect(err.fromClient).to.be(undefined);
				expect(err.fromClientFlow).to.be(undefined);
				expect(err.fromClientMethod).to.be(undefined);
			}
		);
	});

	it('#from flow run', function() {
		const linker = clientlinker({
			flows: ['custom'],
			customFlows: {
				custom: function() {
					throw new Error('from flow run');
				}
			},
			clients: {
				client: null
			}
		});
		linker.flow(
			'confighandler',
			require('clientlinker-flow-confighandler-test').flows.confighandler
		);

		return linker.run('client.method').then(
			function() {
				expect().fail();
			},
			function(err) {
				expect(err.message).to.be('from flow run');
			}
		);
	});

	describe('#retry', function() {
		it('#in defualts', function() {
			let runTimes = 0;
			let triggerTimes = 0;
			const linker = clientlinker({
				flows: ['timingCheck', 'confighandler'],
				customFlows: {
					timingCheck: function(runtime, callback) {
						runTimes++;
						return callback.next();
					}
				},
				defaults: {
					retry: 5,
				},
				clients: {
					client: {
						confighandler: {
							method: function() {
								if (runTimes === 1) throw 333;
								else return 555;
							}
						}
					}
				}
			});
			linker.flow(
				'confighandler',
				require('clientlinker-flow-confighandler-test').flows
					.confighandler
			);

			const retPromise = linker.run('client.method').then(function(data) {
				expect(data).to.be(555);
				expect(runTimes).to.be(2);
				expect(triggerTimes).to.be(2);
			});

			const lastRuntime = linker.lastRuntime;

			linker.on('retry', function({ runtime }) {
				if (runtime === lastRuntime) triggerTimes++;
			});

			return retPromise;
		});

		it('#runOptions', function() {
			let runTimes = 0;
			const linker = clientlinker({
				flows: ['timingCheck', 'confighandler'],
				customFlows: {
					timingCheck: function(runtime, callback) {
						runTimes++;
						return callback.next();
					}
				},
				clients: {
					client: {
						confighandler: {
							method: function() {
								if (runTimes < 4) {
									throw 333;
								} else {
									return 555;
								}
							}
						}
					}
				}
			});
			linker.flow(
				'confighandler',
				require('clientlinker-flow-confighandler-test').flows
					.confighandler
			);

			return linker
				.run('client.method', null, null, { retry: 5 })
				.then(function(data) {
					expect(data).to.be(555);
					expect(runTimes).to.be(4);
				});
		});
	});

	it('#throw null err', function() {
		const linker = clientlinker({
			flows: ['confighandler'],
			clients: {
				client: {
					confighandler: {
						method: function() {
							return Promise.reject();
						}
					}
				}
			}
		});
		linker.flow(
			'confighandler',
			require('clientlinker-flow-confighandler-test').flows.confighandler
		);

		return linker
			.run('client.method')
			.then(
				() => expect().fail(),
				err => expect(err).to.be(undefined)
			);
	});
});
