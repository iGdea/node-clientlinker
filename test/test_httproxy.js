"use strict";

var Promise				= require('bluebird');
var expect				= require('expect.js');
var expr				= require('express');
var http				= require('http');
var ClientLinker		= require('../');
var proxyRoute			= require('../flows/httpproxy/route');
var runClientHandlerIts	= require('./pkghandler/lib/run');
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
		options.pkghandlerDir = __dirname+'/pkghandler';
		(options.clients || (options.clients = {})).client_its = {};

		return ClientLinker(options);
	}
	function initSvrLinker(options)
	{
		options || (options = {});
		options.flows = ['custom', 'pkghandler', 'httpproxy'];
		options.customFlows = {
			custom: function(runtime, callback)
			{
				expect(runtime.data.source).to.be('httpproxy');
				callback.next();
			}
		};

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

		// describe('#run client', function()
		// {
		// 	runClientHandlerIts(svrLinker);
		// });

		describe('#run new client', function()
		{
			runClientHandlerIts(initLinker({}));
		});

		it('#no client', function()
		{
			var linker = initLinker({});
			linker.addClient('client_not_exists');

			return linker.run('client_not_exists.method')
				.then(function(){expect().fail()},
					function(err)
					{
						// 注意：不是NO CLIENT
						expect(err.message).to.contain('CLIENTLINKER:CLIENT FLOW OUT,client_not_exists.method,len1');
						expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
						expect(err.CLIENTLINKER_METHODKEY).to.be('client_not_exists.method');
					});
		});
	});


	describe('#httpproxyKey', function()
	{
		var httpproxyKey = 'xxfde&d023';
		var svrLinker = initSvrLinker(
			{
				defaults: {
					httpproxyKey: httpproxyKey
				}
			});

		describe('#run client', function()
		{
			runClientHandlerIts(initLinker(
				{
					defaults: {
						httpproxyKey: httpproxyKey
					}
				}));
		});

		it('#err403', function()
		{
			var linker = initLinker(
				{
					defaults: {
						httpproxyKey: 'xxx'
					}
				});

			return linker.run('client_its.method')
				.then(function(){expect().fail()},
					function(err)
					{
						expect(err).to.be('respone!200,403');
					});
		});
	});
});
