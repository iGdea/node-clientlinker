'use strict';

const expect = require('expect.js');
const clientlinker = require('clientlinker-core');
const logger = require('../flow/logger');
const loggerFlow = require('../');
const confighanlderFlow = require('clientlinker-flow-confighandler');

describe('#logger', function() {
	it('#param', function() {
		const runDeffer = PromiseDeffer();
		const errorDeffer = PromiseDeffer();
		const linker = simpleLinker(function(type) {
			return function(runtime, err, data) {
				try {
					if (type == 'error') {
						expect(err.message).to.be('error');
						expect(err.fromClient).to.be('client_error');
						expect(err.fromClientFlow).to.be('confighandler');
						expect(data).to.be(null);
						errorDeffer.resolve();
					} else {
						expect(err).to.be(null);
						expect(data).to.be('success');
						runDeffer.resolve();
					}
				} catch (err) {
					type == 'error'
						? errorDeffer.reject(err)
						: runDeffer.reject(err);
				}
			};
		});

		return Promise.all([
			linker.run('client_run.method'),
			linker.run('client_error.method').then(
				function() {
					expect().fail();
				},
				function() {}
			),
			runDeffer.promise,
			errorDeffer.promise
		]);
	});

	it('#defaultLoggerHander', function() {
		const runDeffer = PromiseDeffer();
		const errorDeffer = PromiseDeffer();
		const linker = simpleLinker(function(type) {
			return function() {
				try {
					logger.loggerHandler.apply(null, arguments);
					if (type == 'error') errorDeffer.resolve();
					else runDeffer.resolve();
				} catch (err) {
					if (type == 'error') errorDeffer.reject(err);
					else runDeffer.reject(err);
				}
			};
		});

		return Promise.all([
			linker.run('client_run.method'),
			linker.run('client_error.method').then(
				function() {
					expect().fail();
				},
				function() {}
			),
			runDeffer.promise,
			errorDeffer.promise
		]);
	});
});

function simpleLinker(genLoggerHander) {
	const linker = clientlinker({
		flows: ['logger', 'confighandler'],
		clients: {
			client_run: {
				logger: genLoggerHander('run'),
				confighandler: {
					method: function() {
						return Promise.resolve('success');
					}
				}
			},
			client_error: {
				logger: genLoggerHander('error'),
				confighandler: {
					method: function() {
						return Promise.reject(new Error('error'));
					}
				}
			}
		}
	});

	linker.flow('confighandler', confighanlderFlow);
	linker.flow('logger', loggerFlow);

	return linker;
}

function PromiseDeffer() {
	let resolve, reject;
	const promise = new Promise(function(resolve0, reject0) {
		resolve = resolve0;
		reject = reject0;
	});

	return {
		promise: promise,
		resolve: resolve,
		reject: reject
	};
}
