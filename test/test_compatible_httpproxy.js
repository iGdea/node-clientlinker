"use strict";

var Promise			= require('bluebird');
var ClientLinker	= require('../');
var expect			= require('expect.js');
var request			= require('request');
var oldJSON			= require('../lib/json');
var httpproxy		= require('../flows/httpproxy/httpproxy');
var utilsTestHttpproxy = require('./utils_test_httpproxy');

describe('#compatible_httpproxy', function()
{
	var svrLinker = utilsTestHttpproxy.initTestSvrLinker({});
	var linker = utilsTestHttpproxy.initLinker(
		{
			flows: ['custom'],
			customFlows:
			{
				custom: function custom(runtime, callback)
				{
					var body = httpproxy.getRequestBody_(runtime);
					var opts = httpproxy.getRequestParams_(runtime, body);

					delete opts.headers['Content-Parser'];
					body.CONST_VARS = oldJSON.CONST_VARS;
					opts.body = JSON.stringify(oldJSON.stringify(body));

					request.post(opts, function(err, response, body)
					{
						callback.resolve(
							{
								err: err,
								response: response,
								body: body
							});
					});
				}
			}
		});

	it('#sucess', function()
	{
		return linker.run('client_its.method_promise_resolve')
			.then(function(data)
			{
				expect(data.err).to.be(null);
				expect(data.response.statusCode).to.be(200);

				var body = JSON.parse(data.body);
				expect(body.CONST_VARS).to.be.an('object');
				expect(body.httpproxy_deprecate).to.be.an('array')
					.eql(['update clientklinker, CONST_VARS JSON']);

				body = oldJSON.parse(body, oldJSON.CONST_VARS);
				expect(body.data).to.be(789);
				expect(body.result).to.be(undefined);
			});
	});


	it('#error', function()
	{
		return linker.run('client_its.method_promise_reject_number')
			.then(function(data)
			{
				expect(data.err).to.be(null);
				expect(data.response.statusCode).to.be(200);

				var body = JSON.parse(data.body);
				expect(body.CONST_VARS).to.be.an('object');
				expect(body.httpproxy_deprecate).to.be.an('array')
					.eql(['update clientklinker, CONST_VARS JSON']);

				body = oldJSON.parse(body, oldJSON.CONST_VARS);
				expect(body.data).to.be(undefined);
				expect(body.result).to.be(123);
			});
	});
});
