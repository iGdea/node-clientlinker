require('debug').enable('client_linker*');

var utils	= require('../bin/utils');
var assert			= require('assert');

describe('rlutils', function()
{
	it('parseParam', function()
	{
		assert.equal(utils.parseParam('{"key": "value"}').key, 'value', 'JSON');
		assert.equal(utils.parseParam('{key: "value"}').key, 'value', 'JS1');
		assert.equal(utils.parseParam('{\'key\': "value"}').key, 'value', 'JS2');
		assert.equal(utils.parseParam('({key: "value"})').key, 'value', 'JS3');
		assert.equal(utils.parseParam('./test/localfile/client/json.json').data.string, 'string', 'filepath');
	});
});

