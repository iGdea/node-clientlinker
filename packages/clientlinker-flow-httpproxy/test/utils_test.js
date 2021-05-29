const http = require('http');
const expr = require('express');
const debug = require('debug')('clientlinker-flow-httpproxy:utils_test');
const clientlinker = require('clientlinker');
const proxyRoute = require('../route');
// const expect = require('expect.js');
const confighandlerFlow = require('clientlinker-flow-confighandler');
const confighandlerTest = require('clientlinker-flow-confighandler-test');
const httpproxyFlow = require('../');

exports.PORT = 3423;
exports.initLinker = initLinker;
function initLinker(options) {
	options || (options = {});
	options.flows || (options.flows = ['httpproxy']);

	const httpproxyQuery = options.httpproxyQuery
		? '?' + options.httpproxyQuery
		: '';
	(options.defaults || (options.defaults = {})).httpproxy =
		'http://127.0.0.1:' + exports.PORT + '/route_proxy' + httpproxyQuery;

	options.clients || (options.clients = {});
	options.clients.client_its = {
		confighandler: confighandlerTest.methods
	};
	options.clients.client_svr_noflows = {};
	options.clients.client_svr_not_exists = {};

	const linker = clientlinker(options);
	linker.flow('httpproxy', httpproxyFlow);
	linker.flow('confighandler', confighandlerFlow);

	return linker;
}

exports.initSvrLinker = initSvrLinker;
function initSvrLinker(options) {
	options || (options = {});
	options.flows || (options.flows = ['custom', 'confighandler', 'httpproxy']);
	(options.defaults || (options.defaults = {})).httpproxy =
		'http://127.0.0.1:' + exports.PORT + '/route_proxy';

	options.clients || (options.clients = {});
	options.clients.client_svr_not_exists = null;
	options.clients.client_svr_noflows = { flows: [] };
	options.clients.client_its = {
		confighandler: confighandlerTest.methods
	};
	options.customFlows || (options.customFlows = {});
	options.customFlows.custom = function(runtime, callback) {
		// expect(runtime.env.source).to.be('httpproxy');
		return callback.next();
	};

	let svr;
	let linker = clientlinker(options);
	linker.flow('httpproxy', httpproxyFlow);
	linker.flow('confighandler', confighandlerFlow);

	return {
		linker: linker,
		start: function(callback) {
			let app = expr();
			app.use('/route_proxy', proxyRoute(linker));
			svr = http.createServer();
			svr.listen(exports.PORT, function() {
				debug('proxy ok:http://127.0.0.1:%d/route_proxy', exports.PORT);
				callback && callback();
			});

			app.listen(svr);
		},
		close: function() {
			svr.close();
		}
	};
}

exports.initTestSvrLinker = initTestSvrLinker;
function initTestSvrLinker(options) {
	let svr = initSvrLinker(options);

	before(svr.start);
	after(svr.close);

	return svr.linker;
}
