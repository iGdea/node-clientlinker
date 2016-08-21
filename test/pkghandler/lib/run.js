"use strict";

var Promise	= require('bluebird');
var expect	= require('expect.js');

module.exports = runClientHandler;
function runClientHandler(linker)
{
	var promise1 = linker.run('client.method1', 123,
		{name:'bb', buffer: new Buffer('buffer')},
		{timeout: 1000})
		.then(function(data)
		{
			expect(data).to.be(334);
		});

	var promise2 = linker.run('client.method2')
		.then(function(){expect().fail()},
			function(err)
			{
				expect(err).to.be(123);
			});

	var promise3 = linker.run('client.method3')
		.then(function(data)
		{
			expect(data).to.be(789);
		});

	var promise4 = linker.run('client.method4')
		.then(function(){expect().fail()},
			function(err)
			{
				expect(err).to.be.an(Error);
				expect(err.message).to.be('err123');
			});

	var promise5 = linker.run('client.method5')
		.then(function(){expect().fail()},
			function(err)
			{
				expect(err.message).to.contain('CLIENTLINKER:CLIENT FLOW OUT');
				expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
				expect(err.CLIENTLINKER_METHODKEY).to.be('client.method5');
				expect(err.CLIENTLINKER_CLIENT).to.be('client');
			});

	var promise6 = linker.run('client1001001.method')
		.then(function(){expect().fail()},
			function(err)
			{
				expect(err.message).to.contain('CLIENTLINKER:NO CLIENT');
				expect(err.CLIENTLINKER_TYPE).to.be('NO CLIENT');
				expect(err.CLIENTLINKER_METHODKEY).to.be('client1001001.method');
			});

	return Promise.all([promise1, promise2, promise3, promise4, promise5, promise6]);
}
