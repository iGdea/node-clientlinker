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


describe('#httpproxy', function()
{
	function initLinker(options)
	{
		options || (options = {});
		options.flows || (options.flows = ['httpproxy']);

		(options.defaults || (options.defaults = {})).httpproxy
			= 'http://127.0.0.1:'+PORT+'/route_proxy';
		(options.clients || (options.clients = {})).client
			= {confighandler: require('./pkghandler/client')};

		return ClientLinker(options);
	}
	function initSvrLinker(options)
	{
		options || (options = {});
		options.flows = ['confighandler', 'httpproxy'];

		var svr;
		var linker = initLinker(options);

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


	describe('#base', function()
	{
		var svrLinker = initSvrLinker({});

		it('!run client', function()
		{
			return runClientHandler(svrLinker);
		});

		it('!run new client', function()
		{
			return runClientHandler(initLinker({}));
		});

		it('!no client', function()
		{
			var linker = initLinker({});
			linker.addClient('client10');

			return linker.run('client10.method')
				.then(function(){expect().fail()},
					function(err)
					{
						// 注意：不是NO CLIENT
						expect(err.message).to.contain('CLIENTLINKER:CLIENT FLOW OUT,client10.method,1');
						expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
						expect(err.CLIENTLINKER_METHODKEY).to.be('client10.method');
					});
		});
	});


	describe('#httpproxyKey', function()
	{
		var svrLinker = initSvrLinker(
			{
				defaults: {
					httpproxyKey: 'xxfde&d023'
				}
			});

		it('!run client', function()
		{
			return runClientHandler(svrLinker);
		});

		it('!err403', function()
		{
			var linker = initLinker(
				{
					defaults: {
						httpproxyKey: 'xxx'
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
