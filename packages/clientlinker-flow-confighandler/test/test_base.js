let expect = require('expect.js');
let clientlinker = require('clientlinker');
let confighandlerTest = require('clientlinker-flow-confighandler-test');

describe('#confighandler', function() {
	let linker = clientlinker({
		flows: ['confighandler'],
		clients: {
			client: {
				confighandler: confighandlerTest.methods
			}
		}
	});

	linker.flow('confighandler', require('../'));

	confighandlerTest.run(linker, 'client');

	it('#methods', function() {
		return linker.methods().then(function(map) {
			expect(map.client).to.be.an('object');
			let methods = Object.keys(map.client.methods);
			expect(methods).to.eql([
				'method',
				'method_params',
				'method_promise_resolve',
				'method_promise_reject_number',
				'method_promise_reject_error'
			]);
		});
	});
});
