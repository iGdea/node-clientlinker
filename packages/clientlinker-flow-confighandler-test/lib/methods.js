'use strict';

const Promise = require('bluebird');
const expect = require('expect.js');

module.exports = {
	method: function() {
		return Promise.resolve();
	},
	method_params: function(req, body, options) {
		expect(req).to.be(123);
		expect(body.name).to.be('bb');
		expect(body.buffer).to.be.a(Buffer);
		expect(body.buffer.toString()).to.be('buffer');
		expect(body.buffer.toString('base64')).to.be('YnVmZmVy');
		expect(options.timeout).to.be(1000);

		return 334;
	},
	method_promise_resolve: function() {
		return Promise.resolve(789);
	},
	method_promise_reject_number: function() {
		return Promise.reject(123);
	},
	method_promise_reject_error: function() {
		return Promise.reject(new Error('err123'));
	},
};
