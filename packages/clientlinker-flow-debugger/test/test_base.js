'use strict';

let expect = require('expect.js');
let clientlinker = require('clientlinker-core');

describe('#debugger', function() {
	let linker = clientlinker({
		flows: ['debugger', 'confighandler'],
		clients: {
			client1: {
				confighandler: {
					method1: function() {
						return { string: 'string1' };
					}
				}
			},
			client2: {
				debuggerRuntime: true,
				confighandler: {
					method1: function() {
						return { string: 'string1' };
					}
				}
			}
		}
	});

	linker.flow('debugger', require('../'));
	linker.flow('confighandler', require('clientlinker-flow-confighandler'));

	it('#run', function() {
		let promise1 = linker.run('client1.method').then(
			function() {
				expect().fail();
			},
			function(err) {
				let runtime = err.__runtime__;
				expect(err).to.be.an(Error);
				expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
				expect(runtime).to.be.an('object');
			}
		);

		let promise2 = linker.run('client1.method1').then(function(data) {
			let runtime = data.__runtime__;
			expect(data.string).to.be('string1');
			expect(runtime).to.be.an('object');
		});

		return Promise.all([promise1, promise2]);
	});

	it('#runtime', function() {
		let promise1 = linker.run('client2.method').then(
			function() {
				expect().fail();
			},
			function(runtime) {
				let err = runtime.originalReturn;
				expect(err).to.be.an(Error);
				expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
				expect(runtime).to.be.an('object');
			}
		);

		let promise2 = linker.run('client2.method1').then(function(runtime) {
			let data = runtime.originalReturn;
			expect(data.string).to.be('string1');
			expect(runtime).to.be.an('object');
		});

		return Promise.all([promise1, promise2]);
	});
});
