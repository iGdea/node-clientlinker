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

	return Promise.all([promise1, promise2, promise3, promise4]);
}
