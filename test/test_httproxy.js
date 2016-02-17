var assert				= require('assert');
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
			httpproxy: 'http://127.0.0.1:'+PORT+'/route_proxy?',
			clients: {
				client: null
			}
		});

		return runClientHandler(linker);
	});
});
