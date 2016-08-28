"use strict";

var Promise				= require('bluebird');
var expect				= require('expect.js');
var expr				= require('express');
var http				= require('http');
var ClientLinker		= require('../');
var proxyRoute			= require('../flows/httpproxy/route');
var httpproxy			= require('../flows/httpproxy/httpproxy');
var runClientHandlerIts	= require('./pkghandler/lib/run');
var aes					= require('../lib/aes_cipher');
var debug				= require('debug')('client_linker:test_httproxy');
var request				= require('request');
var PORT				= 3423;
var HTTP_PROXY_URL		= 'http://127.0.0.1:'+PORT+'/route_proxy';

describe('#httpproxy', function()
{
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


	describe('#utils', function()
	{
		it('#appendUrl', function()
		{
			expect(httpproxy.appendUrl_('http://127.0.0.1/', 'a=1'))
				.to.be('http://127.0.0.1/?a=1');
			expect(httpproxy.appendUrl_('http://127.0.0.1/?', 'a=1'))
				.to.be('http://127.0.0.1/?a=1');
			expect(httpproxy.appendUrl_('http://127.0.0.1/?b=1', 'a=1'))
				.to.be('http://127.0.0.1/?b=1&a=1');
			expect(httpproxy.appendUrl_('http://127.0.0.1/?b=1&', 'a=1'))
				.to.be('http://127.0.0.1/?b=1&a=1');
		});
	});

	describe('#options', function()
	{
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

			describe('#err403', function()
			{
				function itKey(name, statusCode, key)
				{
					it('#'+name, function()
					{
						var linker = initLinker(
						{
							flows: [
								function custom(runtime, callback)
								{
									var body = httpproxy.getRequestBody_(runtime);
									body.key = key;
									var opts = httpproxy.getRequestParams_(runtime, body);
									request.post(opts, function(err, response, body)
									{
										callback.resolve(
											{
												err: err,
												response: response,
												body: body
											});
									})
								}]
						});

						return linker.run('client_its.method')
							.then(function(data)
							{
								expect(data.err).to.be(null);
								expect(data.response.statusCode).to.be(statusCode);
							});
					});
				}

				itKey('normal', 200,
					aes.cipher('client_its.method,'+Date.now(), httpproxyKey));

				itKey('no key', 403);
				itKey('err key', 403,
					aes.cipher('client_its.method,'+Date.now(), httpproxyKey+'22'));
				itKey('err key', 403,
					aes.cipher('client_its.method_other,'+Date.now(), httpproxyKey));
				itKey('expired', 403,
					aes.cipher('client_its.method,11', httpproxyKey));

				itKey('direct', 200, httpproxyKey);
			});

			// it('#err403', function()
			// {
			// 	var linker = initLinker(
			// 		{
			// 			defaults: {
			// 				httpproxyKey: 'xxx'
			// 			}
			// 		});
			//
			// 	return linker.run('client_its.method')
			// 		.then(function(){expect().fail()},
			// 			function(err)
			// 			{
			// 				expect(err).to.be('respone!200,403');
			// 			});
			// });
		});


		describe('#httpproxyMaxLevel', function()
		{
			var svrLinker = initSvrLinker(
				{
					defaults:
					{
						httpproxyNotRunWhenBindRoute: false,
						httpproxyMaxLevel: 5
					}
				});

			describe('#run new client', function()
			{
				runClientHandlerIts(initLinker({}));
			});

			describe('#run with deferent level', function()
			{
				function itKey(level)
				{
					it('#'+level, function()
					{
						var linker = initLinker(
							{
								defaults:
								{
									httpproxyMaxLevel: level
								}
							});
						var retPromise = linker.run('client_its.method_no_exists');

						return retPromise
							.then(function(){expect().fail()},
								function(err)
								{
									var runtime = retPromise.runtime;
									expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
									expect(runtime.env.source).to.be('run');
									expect(runtime.env.httpproxyLevel).to.be(5);
								});
					});
				}

				itKey(1);
				itKey(5);
				itKey(-1);
			});
		});


		describe('#httpproxyNotRunWhenBindRoute', function()
		{
			var svrLinker = initSvrLinker(
				{
					defaults:
					{
						httpproxyNotRunWhenBindRoute: true,
						httpproxyMaxLevel: 5
					}
				});

			it('#run 5', function()
			{
				var linker = initLinker(
					{
						defaults:
						{
							httpproxyMaxLevel: 5
						}
					});
				var retPromise = linker.run('client_its.method_no_exists');

				return retPromise
					.then(function(){expect().fail()},
						function(err)
						{
							var runtime = retPromise.runtime;
							expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
							expect(runtime.env.source).to.be('run');
							expect(runtime.env.httpproxyLevel).to.be(1);
						});
			});

			it('#run default', function()
			{
				var linker = initLinker();
				var retPromise = linker.run('client_its.method_no_exists');

				return retPromise
					.then(function(){expect().fail()},
						function(err)
						{
							var runtime = retPromise.runtime;
							expect(err.CLIENTLINKER_TYPE).to.be('CLIENT FLOW OUT');
							expect(runtime.env.source).to.be('run');
							expect(runtime.env.httpproxyLevel).to.be(1);
						});
			});
		});

	});
});




function initLinker(options)
{
	options || (options = {});
	options.flows || (options.flows = ['httpproxy']);

	(options.defaults || (options.defaults = {})).httpproxy = HTTP_PROXY_URL;
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
			expect(runtime.env.source).to.be('httpproxy');
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
