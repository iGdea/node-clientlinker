const expect = require('expect.js');
const clientlinker = require('clientlinker-core');
const confighandlerTest = require('clientlinker-flow-confighandler-test');

describe('#pkghandler', function() {
	const pkghandlerFile = 'clientlinker-flow-confighandler-test/lib/methods';
	const linker = clientlinker({
		flows: ['pkghandler'],
		defaults: {
			opt: 'myOpt'
		},
		clients: {
			client_its: {
				pkghandler: pkghandlerFile
			}
		}
	});

	linker.flow('pkghandler', require('../'));

	confighandlerTest.run(linker, 'client_its');

	it('#methods', function() {
		return linker.methods().then(function(map) {
			expect(map.client_its).to.be.an('object');
			expect(map.client_its.client.options.opt).to.be('myOpt');
			expect(map.client_its.client.options.pkghandler).to.be(
				pkghandlerFile
			);
			// expect(map.client2.client.options.pkghandler)
			//	.to.contain('pkghandler/not_exsits');

			const methods = Object.keys(map.client_its.methods);
			expect(methods).to.eql([
				'method',
				'method_params',
				'method_promise_resolve',
				'method_promise_reject_number',
				'method_promise_reject_error'
			]);
		});
	});

	it('#not_exsits', function() {
		linker.client('client2', {
			pkghandler: __dirname + '/pkghandler/not_exsits'
		});

		return linker.methods().then(
			function() {
				expect().fail();
			},
			function(err) {
				expect(err.message).contain('Cannot find module');
			}
		);
	});
});
