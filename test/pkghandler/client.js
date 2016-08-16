"use strict";

var Promise	= require('bluebird');
var expect	= require('expect.js');

module.exports = {
	method1: function(req, body, callback, options)
	{
		expect(req).to.be(123);
		expect(body.name).to.be('bb');
		expect(body.buffer).to.be.a(Buffer);
		expect(body.buffer.toString()).to.be('buffer');
		expect(body.buffer.toString('base64')).to.be('YnVmZmVy');
		expect(callback).to.be.an('function')
		expect(options.timeout).to.be(1000);

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
