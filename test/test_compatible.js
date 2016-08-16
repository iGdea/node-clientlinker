"use strict";

var Promise			= require('bluebird');
var ClientLinker	= require('../');
var expect			= require('expect.js');

describe('compatible', function()
{
	it('runOptions', function()
	{
		var linker = new ClientLinker(
			{
				flows: [function flow(runtime, callback)
					{
						expect(runtime.runOptions.param).to.be('pp');
						runtime.runOptions.param = 'p1';
						expect(runtime.options.param).to.be('p1');
						runtime.runOptions = {param: 'p2'}
						expect(runtime.options.param).to.be('p2');

						callback();
					}],
				clients:
				{
					client: {}
				}
			});

		return linker.run('client.method', null, null, null, {param: 'pp'});
	});


	it('navigationStart', function()
	{
		var linker = ClientLinker(
			{
				flows: ['debug'],
				clients:
				{
					client: null
				}
			});

		return linker.run('client.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.__runtime__.timing.navigationStart).to.be.a('number');
					expect(err.__runtime__.timing.navigationStart).to.be(err.__runtime__.navigationStart);
				});
	});
});
