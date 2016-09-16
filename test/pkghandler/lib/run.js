"use strict";

var Promise	= require('bluebird');
var expect	= require('expect.js');

module.exports = runClientHandlerIts;
function runClientHandlerIts(linker)
{
	it('#run params', function()
	{
		return linker.run('client_its.method_params', 123,
			{name:'bb', buffer: new Buffer('buffer')},
			{timeout: 1000})
			.then(function(data)
			{
				expect(data).to.be(334);
			});
	});


	it('#return promise data', function()
	{
		return linker.run('client_its.method_promise_resolve', null, null, 3)
			.then(function(data)
			{
				expect(data).to.be(789);
			});
	});


	it('#return promise error', function()
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
	});


	it('#callback data', function()
	{
		return linker.run('client_its.method_callback_data')
			.then(function(data)
			{
				expect(data).to.be(22);
			});
	});


	it('#callack error', function()
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
	});


	it('#method not exists', function()
	{
		return linker.run('client_its.method_not_exists')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.contain('CLIENTLINKER:CLIENT FLOW OUT');
					expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
					expect(err.CLIENTLINKER_ACTION).to.be('client_its.method_not_exists');
					expect(err.CLIENTLINKER_CLIENT).to.be('client_its');
				});
	});

	it('#client not exists', function()
	{
		return linker.run('client_not_exists.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.contain('CLIENTLINKER:NO CLIENT');
					expect(err.CLIENTLINKER_TYPE).to.be('NO CLIENT');
					expect(err.CLIENTLINKER_ACTION).to.be('client_not_exists.method');
				});
	});
}
