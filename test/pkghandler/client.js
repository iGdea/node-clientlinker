var Promise	= require('bluebird');
var assert	= require('assert');

module.exports = {
	method1: function(req, body, callback, runOptions)
	{
		assert.equal(req, 123);
		assert.equal(body.name, 'bb');
		assert(Buffer.isBuffer(body.buffer));
		assert.equal(body.buffer.toString(), 'buffer');
		assert.equal(body.buffer.toString('base64'), 'YnVmZmVy');
		assert.equal(typeof callback, 'function');
		assert.equal(runOptions.timeout, 1000);

		callback(null, 334);
	},
	method2: function()
	{
		return Promise.reject(123);
	},
	method3: function()
	{
		return Promise.resolve(789);
	},
	method4: function()
	{
		return Promise.reject(new Error('err123'));
	}
};