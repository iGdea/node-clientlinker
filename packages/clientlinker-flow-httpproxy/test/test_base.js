'use strict';

let expect				= require('expect.js');
let utilsTestHttpproxy	= require('./utils_test');
let confighandlerTest	= require('clientlinker-flow-confighandler-test');

let initLinker			= utilsTestHttpproxy.initLinker;
let initTestSvrLinker	= utilsTestHttpproxy.initTestSvrLinker;

describe('#base', function()
{
	initTestSvrLinker({});

	// describe('#run client', function()
	// {
	// 	confighandlerTest.run(svrLinker);
	// });

	describe('#run new client', function()
	{
		confighandlerTest.run(initLinker({}));
	});

	it('#no client', function()
	{
		let linker = initLinker({});
		linker.client('client_not_exists', {});

		return linker.run('client_not_exists.method')
			.then(function(){expect().fail()},
				function(err)
				{
					// 注意：不是NO CLIENT
					expect(err.message)
						.to.contain('CLIENTLINKER:NotFound,client_not_exists.method');
					expect(err.CLIENTLINKER_TYPE)
						.to.be('CLIENT FLOW OUT');
					// expect(err.CLIENTLINKER_ACTION)
						// .to.be('client_not_exists.method');
				});
	});
});
