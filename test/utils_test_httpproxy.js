var http				= require('http');
var expr				= require('express');
var debug				= require('debug')('client_linker:test_httproxy');
var ClientLinker		= require('../');
var proxyRoute			= require('../flows/httpproxy/route');
var expect				= require('expect.js');

var PORT				= 3423;
var HTTP_PROXY_URL		= 'http://127.0.0.1:'+PORT+'/route_proxy';



exports.initLinker = initLinker;
function initLinker(options)
{
	options || (options = {});
	options.flows || (options.flows = ['httpproxy']);

	(options.defaults || (options.defaults = {})).httpproxy = HTTP_PROXY_URL;
	options.pkghandlerDir = __dirname+'/pkghandler';
	options.clients || (options.clients = {});
	options.clients.client_its = {};
	options.clients.client_svr_noflows = {};
	options.clients.client_svr_not_exists = {};

	return ClientLinker(options);
}


exports.initSvrLinker = initSvrLinker;
function initSvrLinker(options)
{
	options || (options = {});
	options.flows = ['custom', 'pkghandler', 'httpproxy'];
	options.clients || (options.clients = {});
	options.clients.client_svr_noflows = {flows: []};
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
