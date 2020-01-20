/* global Promise */

'use strict';

let expect = require('expect.js');

describe('#promise', function() {
	it('#global promise', function() {
		if (global.Promise) expect(Promise).to.not.be.a(require('bluebird'));
	});
});
