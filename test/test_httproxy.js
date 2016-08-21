"use strict";

var Promise				= require('bluebird');
var expect				= require('expect.js');
var expr				= require('express');
var http				= require('http');
var ClientLinker		= require('../');
var proxyRoute			= require('../flows/httpproxy/route');
var runClientHandler	= require('./pkghandler/lib/run');
var debug				= require('debug')('client_linker:test_httproxy');
var PORT				= 3423;

describe('httpproxy', function()
{

	function initSvrLinker(config)
	{
		var svr;
		var linker = ClientLinker(config);

		before(function(done)
		{
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

		return linker;
	}


	describe('base', function()
	{
		var svrLinker = initSvrLinker(
			{
				flows: ['confighandler', 'httpproxy'],
				clients: {
					client: {
						confighandler: require('./pkghandler/client')
					}
				}
			});


		it('run client', function()
		{
			return runClientHandler(svrLinker);
		});

		it('run new client', function()
		{
			var linker = ClientLinker(
			{
				flows: ['httpproxy'],
				defaults:
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
		var svrLinker = initSvrLinker(
			{
				flows: ['confighandler', 'httpproxy'],
				defaults:
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

		it('run client', function()
		{
			return runClientHandler(svrLinker);
		});

		it('err403', function()
		{
			var linker = ClientLinker(
			{
				flows: ['httpproxy'],
				defaults:
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
});
