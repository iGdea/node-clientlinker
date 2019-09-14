'use strict';

var Promise				= require('bluebird');
var expect				= require('expect.js');
var clientlinker		= require('clientlinker');
var logger				= require('../flow/logger');
var loggerFlow			= require('../');
var confighanlderFlow	= require('clientlinker-flow-confighandler');


describe('#logger', function()
{
	it('#param', function()
	{
		var runDeffer = PromiseDeffer();
		var errorDeffer = PromiseDeffer();
		var linker = simpleLinker(function(type)
		{
			return function(runtime, err, data)
			{
				try {
					var timing = runtime.timing;
					var lastFlowTiming = runtime.lastFlow().timing;

					expect(lastFlowTiming.start).to.be.an('number');
					expect(lastFlowTiming.end).to.be.an('number');
					expect(timing.flowsStart).to.be.an('number');
					expect(timing.flowsEnd).to.be.an('number');

					if (type == 'error')
					{
						expect(err.message).to.be('error');
						expect(err.fromClient).to.be('client_error');
						expect(err.fromClientFlow).to.be('confighandler');
						expect(data).to.be(null);
						errorDeffer.resolve();
					}
					else
					{
						expect(err).to.be(null);
						expect(data).to.be('success');
						runDeffer.resolve();
					}
				}
				catch(err)
				{
					type == 'error'
						? errorDeffer.reject(err)
						: runDeffer.reject(err);
				}
			};
		});

		return Promise.all(
		[
			linker.run('client_run.method'),
			linker.run('client_error.method')
				.then(function(){expect().fail()}, function(){}),
			runDeffer.promise,
			errorDeffer.promise
		]);
	});

	it('#defaultLoggerHander', function()
	{
		var runDeffer = PromiseDeffer();
		var errorDeffer = PromiseDeffer();
		var linker = simpleLinker(function(type)
		{
			return function()
			{
				try {
					logger.loggerHandler.apply(null, arguments);
					if (type == 'error')
						errorDeffer.resolve();
					else
						runDeffer.resolve();
				}
				catch(err)
				{
					if (type == 'error')
						errorDeffer.reject(err);
					else
						runDeffer.reject(err);
				}
			};
		});

		return Promise.all(
		[
			linker.run('client_run.method'),
			linker.run('client_error.method')
				.then(function(){expect().fail()}, function(){}),
			runDeffer.promise,
			errorDeffer.promise
		]);
	});
});




function simpleLinker(genLoggerHander)
{
	var linker = clientlinker(
	{
		flows: ['logger', 'confighandler'],
		clients:
		{
			client_run:
			{
				logger: genLoggerHander('run'),
				confighandler:
				{
					method: function()
					{
						return Promise.resolve('success');
					}
				}
			},
			client_error:
			{
				logger: genLoggerHander('error'),
				confighandler:
				{
					method: function()
					{
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

function PromiseDeffer()
{
	var resolve, reject;
	var promise = new Promise(function(resolve0, reject0)
	{
		resolve = resolve0;
		reject = reject0;
	});

	return {
		promise: promise,
		resolve: resolve,
		reject: reject
	};
}
