"use strict";

var utils			= require('../bin/utils');
var expect			= require('expect.js');
var ClientLinker	= require('../');

describe('#rlutils', function()
{
	it('!parseParam', function()
	{
		var linker = new ClientLinker;
		expect(utils.parseParam(linker, '{"key": "value"}').key).to.be('value');
		expect(utils.parseParam(linker, '{key: "value"}').key).to.be('value');
		expect(utils.parseParam(linker, '{\'key\': "value"}').key).to.be('value');
		expect(utils.parseParam(linker, '({key: "value"})').key).to.be('value');
		expect(utils.parseParam(linker, './test/localfile/client/json.json').data.string).to.be('string');
	});
});
