"use strict";

var Promise				= require('bluebird');
var expect				= require('expect.js');
var expr				= require('express');
var http				= require('http');
var ClientLinker		= require('../');
var proxyRoute			= require('../flows/httpproxy/route');
var runClientHandler	= require('./runClientHandler');
var debug				= require('debug')('client_linker:test_httproxy');
var PORT				= 3423;

describe('httpproxy', function()
{
	var svr;
	before(function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clients: {
					client: {
						confighandler: require('./pkghandler/client')
					}
				}
			});

		var app = expr();
		app.use('/route_proxy', proxyRoute(linker));
		svr = http.createServer();
		svr.listen(PORT, function()
			{
				debug('proxy ok:http://127.0.0.1:%d/route_proxy', PORT);
				done();
			});
		app.listen(svr);
	});

	after(function()
	{
		svr.close();
	});

	it('httproxy', function()
	{
		var linker = ClientLinker(
		{
			flows: ['httpproxy'],
			clientDefaultOptions:
			{
				httpproxy: 'http://127.0.0.1:'+PORT+'/route_proxy?',
			},
			clients: {
				client: null
			}
		});

		return runClientHandler(linker);
	});
});


describe('httpproxyKey', function()
{
	var svr;
	before(function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler', 'httpproxy'],
				clientDefaultOptions:
				{
					httpproxy: 'http://127.0.0.1:'+PORT+'/route_proxy',
					httpproxyKey: 'xdfegg&xx'
				},
				clients: {
					client:
					{
						confighandler: require('./pkghandler/client')
					}
				}
			});

		var app = expr();
		app.use('/route_proxy', proxyRoute(linker));
		svr = http.createServer();
		svr.listen(PORT, function()
			{
				debug('proxy ok:http://127.0.0.1:%d/route_proxy', PORT);
				done();
			});

		app.listen(svr);
	});

	after(function()
	{
		svr.close();
	});

	it('run', function()
	{
		var linker = ClientLinker(
		{
			flows: ['httpproxy'],
			clientDefaultOptions:
			{
				httpproxy: 'http://127.0.0.1:'+PORT+'/route_proxy?',
				httpproxyKey: 'xdfegg&xx'
			},
			clients: {
				client: null
			}
		});


		var promise1 = linker.run('client.method5')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.contain('CLIENTLINKER:CLIENT FLOW OUT');
					expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
					expect(err.CLIENTLINKER_METHODKEY).to.be('client.method5');
					expect(err.CLIENTLINKER_CLIENT).to.be('client');
				});

		var promise2 = linker.run('client1.method')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err.message).to.contain('CLIENTLINKER:NO CLIENT');
					expect(err.CLIENTLINKER_TYPE).to.be('NO CLIENT');
					expect(err.CLIENTLINKER_METHODKEY).to.be('client1.method');
				});

		return Promise.all(
			[
				runClientHandler(linker),
				promise1, promise2
			]);
	});

	it('err403', function()
	{
		var linker = ClientLinker(
		{
			flows: ['httpproxy'],
			clientDefaultOptions:
			{
				httpproxy: 'http://127.0.0.1:'+PORT+'/route_proxy?',
				httpproxyKey: 'xx'
			},
			clients: {
				client: null
			}
		});

		return linker.run('client.method3')
			.then(function(){expect().fail()},
				function(err)
				{
					expect(err).to.be('respone!200,403');
				});
	});
});
