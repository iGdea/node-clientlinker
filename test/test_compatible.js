"use strict";

var Promise			= require('bluebird');
var ClientLinker	= require('../');
var assert			= require('assert');

describe('compatible', function()
{
	it('runOptions', function()
	{
		var linker = new ClientLinker(
			{
				flows: [function flow(runtime, callback)
					{
						assert.equal(runtime.runOptions.param, 'pp');
						runtime.runOptions.param = 'p1';
						assert.equal(runtime.options.param, 'p1');
						runtime.runOptions = {param: 'p2'}
						assert.equal(runtime.options.param, 'p2');
						callback();
					}],
				clients:
				{
					client: {}
				}
			});

		return linker.run('client.method', null, null, null, {param: 'pp'});
	});
});
