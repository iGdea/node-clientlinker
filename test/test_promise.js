"use strict";

var assert = require('assert');

describe('promise', function()
{
	it('global promise', function()
	{
		if (global.Promise)
			assert.notStrictEqual(Promise, require('bluebird'));
	});
});
