'use strict';

var Promise	= require('bluebird');
var expect	= require('expect.js');

exports = module.exports = runClientHandlerIts;
exports.tests = [
	testRunParam,
	testReturnPromiseData, testReturnPromiseError,
	testCallbackData, testCallbackError,
	testMethodNotExists, testClentNotExists
];


function testRunParam(linker)
{
	return linker.run('client_its.method_params', 123,
		{name:'bb', buffer: new Buffer('buffer')},
		{timeout: 1000})
		.then(function(data)
		{
			expect(data).to.be(334);
		});
}

function testReturnPromiseData(linker)
{
	return linker.run('client_its.method_promise_resolve', null, null, 3)
		.then(function(data)
		{
			expect(data).to.be(789);
		});
}

function testReturnPromiseError(linker)
{
	var promise1 = linker.run('client_its.method_promise_reject_number')
		.then(function(){expect().fail()},
			function(err)
			{
				expect(err).to.be(123);
			});

	var promise2 = linker.run('client_its.method_promise_reject_error')
		.then(function(){expect().fail()},
			function(err)
			{
				expect(err).to.be.an(Error);
				expect(err.message).to.be('err123');
			});

	return Promise.all([promise1, promise2]);
}

function testCallbackData(linker)
{
	return linker.run('client_its.method_callback_data')
		.then(function(data)
		{
			expect(data).to.be(22);
		});
}

function testCallbackError(linker)
{
	var promise1 = linker.run('client_its.method_callback_error_number')
		.then(function(){expect().fail()},
			function(err)
			{
				expect(err).to.be(33);
			});

	var promise2 = linker.run('client_its.method_callback_error_error')
		.then(function(){expect().fail()},
			function(err)
			{
				expect(err).to.be.an(Error);
				expect(err.message).to.be('err44');
			});

	return Promise.all([promise1, promise2]);
}

function testMethodNotExists(linker)
{
	return linker.run('client_its.method_not_exists')
		.then(function(){expect().fail()},
			function(err)
			{
				expect(err.message).to.contain('CLIENTLINKER:NotFound');
				expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
				expect(err.CLIENTLINKER_ACTION).to.be('client_its.method_not_exists');
				expect(err.CLIENTLINKER_CLIENT).to.be('client_its');
			});
}


function testClentNotExists(linker)
{
	return linker.run('client_not_exists.method')
		.then(function(){expect().fail()},
			function(err)
			{
				expect(err.message).to.contain('CLIENTLINKER:NotFound');
				expect(err.CLIENTLINKER_TYPE).to.be('NO CLIENT');
				expect(err.CLIENTLINKER_ACTION).to.be('client_not_exists.method');
			});
}


function runClientHandlerIts(linker)
{
	exports.tests.forEach(function(handler)
	{
		it('#'+handler.name, function()
		{
			handler(linker);
		});
	});
}
