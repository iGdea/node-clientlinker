/* global before after */

"use strict";

var http				= require('http');
var expr				= require('express');
var debug				= require('debug')('clientlinker:test_httproxy');
var ClientLinker		= require('../');
var proxyRoute			= require('../flows/httpproxy/route');
var expect				= require('expect.js');



exports.PORT = 3423;
exports.initLinker = initLinker;
function initLinker(options)
{
	options || (options = {});
	options.flows || (options.flows = ['httpproxy']);

	(options.defaults || (options.defaults = {})).httpproxy
			= 'http://127.0.0.1:'+exports.PORT+'/route_proxy';

	options.clients || (options.clients = {});
	options.clients.client_its =
	{
		pkghandler: __dirname+'/pkghandler/client_its'
	};
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
			return callback.next();
		}
	};

	var svr;
	var linker = initLinker(options);

	return {
		svr: svr,
		linker: linker,
		start: function(callback)
		{
			var app = expr();
			app.use('/route_proxy', proxyRoute(linker));
			svr = http.createServer();
			svr.listen(exports.PORT, function()
				{
					debug('proxy ok:http://127.0.0.1:%d/route_proxy', exports.PORT);
					callback && callback();
				});

			app.listen(svr);
		},
		close: function()
		{
			svr.close();
		}
	}
}


exports.initTestSvrLinker = initTestSvrLinker;
function initTestSvrLinker(options)
{
	var svr = initSvrLinker(options);

	before(svr.start);
	after(svr.close);

	return svr.linker;
}
