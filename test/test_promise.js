var assert = require('assert');

describe('promise', function()
{
	it('global promise', function()
	{
		assert.notStrictEqual(Promise, require('bluebird'));
	});
});
