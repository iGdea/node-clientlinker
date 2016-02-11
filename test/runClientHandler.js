var assert = require('assert');

module.exports = runClientHandler;
function runClientHandler(linker)
{
	var promise1 = linker.run('client.method1', 123,
		{name:'bb', buffer: new Buffer('buffer')},
		{timeout: 1000})
		.then(function(data)
		{
			assert.equal(data, 334);
		});

	var promise2 = linker.run('client.method2')
		.then(function()
		{
			assert(false);
		},
		function(err)
		{
			assert.equal(err, 123);
		});

	var promise3 = linker.run('client.method3')
		.then(function(data)
		{
			assert.equal(data, 789);
		})

	return Promise.all([promise1, promise2, promise3]);
}
