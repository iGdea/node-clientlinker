'use strict';

const expect = require('expect.js');
const debug = require('debug')('clientlinker-flow-confighandler-test');

exports = module.exports = runClientHandler;
exports.tests = [
	testRunParam,
	testReturnPromiseData,
	testReturnPromiseError,
	testMethodNotExists,
	testClentNotExists
];

function testRunParam(linker, clientName) {
	if (!clientName) clientName = 'client_its';
	return linker
		.run(
			clientName + '.method_params',
			123,
			{ name: 'bb', buffer: Buffer.from('buffer') },
			{ timeout: 1000 }
		)
		.then(function(data) {
			expect(data).to.be(334);
		});
}

function testReturnPromiseData(linker, clientName) {
	if (!clientName) clientName = 'client_its';
	return linker
		.run(clientName + '.method_promise_resolve', null, null, 3)
		.then(function(data) {
			expect(data).to.be(789);
		});
}

function testReturnPromiseError(linker, clientName) {
	if (!clientName) clientName = 'client_its';
	const promise1 = linker
		.run(clientName + '.method_promise_reject_number')
		.then(
			function() {
				expect().fail();
			},
			function(err) {
				expect(err).to.be(123);
			}
		);

	const promise2 = linker.run(clientName + '.method_promise_reject_error').then(
		function() {
			expect().fail();
		},
		function(err) {
			expect(err).to.be.an(Error);
			expect(err.message).to.be('err123');
		}
	);

	return Promise.all([promise1, promise2]);
}

function testMethodNotExists(linker, clientName) {
	if (!clientName) clientName = 'client_its';
	return linker.run(clientName + '.method_not_exists').then(
		function() {
			expect().fail();
		},
		function(err) {
			expect(err.message).to.contain('CLIENTLINKER:NotFound');
			expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
			// expect(err.CLIENTLINKER_ACTION).to.be(clientName+'.method_not_exists');
			// expect(err.CLIENTLINKER_CLIENT).to.be(clientName+'');
		}
	);
}

function testClentNotExists(linker, clientName) {
	if (!clientName) clientName = 'client_its';
	return linker.run('client_not_exists.method').then(
		function() {
			expect().fail();
		},
		function(err) {
			expect(err.message).to.contain('CLIENTLINKER:NotFound');
			// expect(err.CLIENTLINKER_TYPE).to.be('NO CLIENT');
			// expect(err.CLIENTLINKER_ACTION).to.be('client_not_exists.method');
		}
	);
}

function runClientHandler(linker, clientName) {
	if (!clientName) clientName = 'client_its';
	debug('client name:%s', clientName);

	exports.tests.forEach(function(handler) {
		debug('add it:%s', handler.name);
		it('#' + handler.name, function() {
			return handler(linker, clientName);
		});
	});
}
