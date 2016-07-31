"use strict";

require('debug').enable('client_linker*');

var utils			= require('../bin/utils');
var assert			= require('assert');
var ClientLinker	= require('../');

describe('rlutils', function()
{
	it('parseParam', function()
	{
		var linker = new ClientLinker;
		assert.equal(utils.parseParam(linker, '{"key": "value"}').key, 'value', 'JSON');
		assert.equal(utils.parseParam(linker, '{key: "value"}').key, 'value', 'JS1');
		assert.equal(utils.parseParam(linker, '{\'key\': "value"}').key, 'value', 'JS2');
		assert.equal(utils.parseParam(linker, '({key: "value"})').key, 'value', 'JS3');
		assert.equal(utils.parseParam(linker, './test/localfile/client/json.json').data.string, 'string', 'filepath');
	});
});
