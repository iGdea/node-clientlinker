'use strict';

const expect = require('expect.js');
const request = require('request');
const httpproxy = require('../flow/httpproxy');
const utilsTestHttpproxy = require('./utils_test');
const confighandlerTest = require('clientlinker-flow-confighandler-test');

const initLinker = utilsTestHttpproxy.initLinker;
const initTestSvrLinker = utilsTestHttpproxy.initTestSvrLinker;

function postDataResolve(opts) {
	return new Promise(resolve => {
		request.post(opts, (err, response, body) => {
			resolve({
				err: err,
				response: response,
				body: body
			});
		});
	});
}

describe('#httpproxy', function() {
	describe('#utils', function() {
		it('#appendUrl', function() {
			expect(httpproxy.appendUrl_('http://127.0.0.1/', 'a=1')).to.be(
				'http://127.0.0.1/?a=1'
			);
			expect(httpproxy.appendUrl_('http://127.0.0.1/?', 'a=1')).to.be(
				'http://127.0.0.1/?a=1'
			);
			expect(httpproxy.appendUrl_('http://127.0.0.1/?b=1', 'a=1')).to.be(
				'http://127.0.0.1/?b=1&a=1'
			);
			expect(httpproxy.appendUrl_('http://127.0.0.1/?b=1&', 'a=1')).to.be(
				'http://127.0.0.1/?b=1&a=1'
			);
		});
	});

	describe('#err statusCode', function() {
		describe('#5xx', function() {
			initTestSvrLinker();
			const linker = initLinker({
				flows: ['custom'],
				customFlows: {
					custom: function custom(runtime) {
						const body = httpproxy.getRequestBody_(runtime);
						const opts = httpproxy.getRequestParams_(runtime, body);
						httpproxy.appendRequestTimeHeader_(runtime, opts);

						return postDataResolve(opts);
					}
				}
			});

			const linker2 = initLinker();

			describe('#501', function() {
				function itKey(name, action) {
					it('#request:' + name, function() {
						return linker.run(action).then(function(data) {
							expect(data.err).to.be(null);
							expect(data.response.statusCode).to.be(501);
						});
					});

					it('#run:' + name, function() {
						const retPromise = linker2.run(action);
						const runtime = linker2.lastRuntime;

						return retPromise.then(
							function() {
								expect().fail();
							},
							function(err) {
								const responseError = runtime.debug(
									'httpproxyResponseError'
								);
								expect(responseError.message).to.be(
									'httpproxy,response!200,501'
								);
								expect(err.message.substr(0, 22)).to.be(
									'CLIENTLINKER:NotFound,'
								);
							}
						);
					});
				}

				itKey('method not exists', 'client_its.method_no_exists');
				itKey('no flows', 'client_svr_noflows.method');
				itKey('no client', 'client_svr_not_exists.method');
			});
		});

		describe('#5xx_parse', function() {
			initTestSvrLinker();
			const linker = initLinker({
				flows: ['custom'],
				customFlows: {
					custom: function custom(runtime) {
						const body = httpproxy.getRequestBody_(runtime);
						const opts = httpproxy.getRequestParams_(runtime, body);
						httpproxy.appendRequestTimeHeader_(runtime, opts);
						opts.body = '{dd';

						return postDataResolve(opts);
					}
				}
			});

			it('#err', function() {
				return linker
					.run('client_its.method_promise_resolve')
					.then(function(data) {
						expect(data.err).to.be(null);
						expect(data.response.statusCode).to.be(500);
						const body = JSON.parse(data.body);
						expect(body.httpproxy_msg).to.be.an('array');
						expect(body.httpproxy_msg.join()).to.contain(
							'clientlinker run err:'
						);
					});
			});
		});
	});

	describe('#options', function() {
		describe('#httpproxyKey', function() {
			let httpproxyKey = 'xxfde&d023';
			initTestSvrLinker({
				defaults: {
					httpproxyKey: httpproxyKey
				}
			});

			describe('#run client', function() {
				confighandlerTest.run(
					initLinker({
						defaults: {
							httpproxyKey: httpproxyKey
						}
					})
				);
			});

			describe('#err403', function() {
				function itKey(name, statusCode, key) {
					it('#' + name, function() {
						const linker = initLinker({
							flows: ['custom'],
							defaults: {
								httpproxyKey: httpproxyKey
							},
							customFlows: {
								custom: function custom(runtime) {
									const body = httpproxy.getRequestBody_(
										runtime
									);
									const opts = httpproxy.getRequestParams_(
										runtime,
										body
									);
									httpproxy.appendRequestTimeHeader_(
										runtime,
										opts
									);

									if (key) {
										opts.headers['XH-Httpproxy-Key2'] = key;
									} else if (key === null) {
										delete opts.headers['XH-Httpproxy-Key'];
										delete opts.headers[
											'XH-Httpproxy-Key2'
										];
									}

									return postDataResolve(opts);
								}
							}
						});

						return linker
							.run('client_its.method')
							.then(function(data) {
								expect(data.err).to.be(null);
								expect(data.response.statusCode).to.be(
									statusCode
								);
								expect(data.body).to.contain('route catch:');
							});
					});
				}

				itKey('normal', 200);
				itKey('err key', 403, 'dddd');
				itKey('no key', 403, null);
				itKey('direct', 403, httpproxyKey);

				it('#repeat', function() {
					let firstOtps = null;
					const linker = initLinker({
						flows: ['custom'],
						defaults: {
							httpproxyKey: httpproxyKey
						},
						customFlows: {
							custom: function custom(runtime) {
								if (!firstOtps) {
									const body = httpproxy.getRequestBody_(
										runtime
									);
									firstOtps = httpproxy.getRequestParams_(
										runtime,
										body
									);
									httpproxy.appendRequestTimeHeader_(
										runtime,
										firstOtps
									);
								}

								return postDataResolve(firstOtps);
							}
						}
					});

					return linker
						.run('client_its.method')
						.then(function(data) {
							expect(data.err).to.be(null);
							expect(data.response.statusCode).to.be(200);
							expect(data.body).to.contain('route catch:');
						})
						.then(function() {
							return linker.run('client_its.method');
						})
						.then(function(data) {
							expect(data.err).to.be(null);
							expect(data.response.statusCode).to.be(403);
							expect(data.body).to.contain('route catch:');
						});
				});

				it('#check signa', function() {
					const linker = initLinker({
						flows: ['custom'],
						defaults: {
							httpproxyKey: httpproxyKey
						},
						customFlows: {
							custom: function custom(runtime) {
								const body = httpproxy.getRequestBody_(runtime);
								const opts = httpproxy.getRequestParams_(
									runtime,
									body
								);
								httpproxy.appendRequestTimeHeader_(
									runtime,
									opts
								);

								opts.body = opts.body.replace(/\t/g, '  ');

								return postDataResolve(opts);
							}
						}
					});

					return linker.run('client_its.method').then(function(data) {
						expect(data.err).to.be(null);
						expect(data.response.statusCode).to.be(403);
						expect(data.body).to.contain('route catch:');
					});
				});
			});
		});

		describe('#httpproxyMaxLevel', function() {
			function descKey(svrLevel) {
				function itClientKey(clientLevel) {
					it('#client run level:' + clientLevel, function() {
						let linker = initLinker({
							defaults: {
								httpproxyMaxLevel: clientLevel
							}
						});
						let retPromise = linker.run(
							'client_its.method_no_exists'
						);
						let runtime = linker.lastRuntime;

						return retPromise.then(
							function() {
								expect().fail();
							},
							function(err) {
								expect(err.CLIENTLINKER_TYPE).to.be(
									'CLIENT FLOW OUT'
								);
								expect(runtime.env.source).to.be('run');

								if (clientLevel === 0) {
									expect(
										runtime.tmp.httpproxyLevelTotal
									).to.be(undefined);
									expect(runtime.tmp.httpproxyLevel).to.be(
										undefined
									);
									let responseError = runtime.retry[0].getFlowRuntime(
										'httpproxy'
									).httpproxyResponseError;
									expect(responseError).to.be(undefined);
								} else {
									let targetSvrLevel =
										svrLevel > 0 ? svrLevel : 1;
									expect(
										runtime.tmp.httpproxyLevelTotal
									).to.be(targetSvrLevel);
									expect(runtime.tmp.httpproxyLevel).to.be(1);
									let responseError = runtime.debug(
										'httpproxyResponseError'
									);
									expect(responseError.message).to.be(
										'httpproxy,response!200,501'
									);
									expect(err.message.substr(0, 22)).to.be(
										'CLIENTLINKER:NotFound,'
									);
								}
							}
						);
					});
				}

				describe('#svrLevel:' + svrLevel, function() {
					initTestSvrLinker({
						// flows: ['httpproxy'],
						defaults: {
							httpproxyMaxLevel: svrLevel
						}
					});

					describe('#run new client', function() {
						confighandlerTest.run(initLinker({}));
					});

					itClientKey(1);
					itClientKey(5);
					itClientKey();
					itClientKey(0);
					itClientKey(-1);
				});
			}

			descKey(3);
			descKey(1);
			descKey();
			descKey(0);
			descKey(-1);
		});
	});

	describe('#env', function() {
		describe('#httpproxyHeader', function() {
			initTestSvrLinker({
				clients: {
					client_svr_customflow: {
						flows: ['it_customflow']
					}
				},
				customFlows: {
					it_customflow: function custom(runtime) {
						return {
							httpproxyHeaders: runtime.env.httpproxyHeaders
						};
					}
				}
			});

			it('#httpproxyHeader', function() {
				const linker = initLinker({
					defaults: {
						httpproxyHeaders: {
							httpproxyCustomHeader: 'httpproxyCustomHeader'
						}
					},
					clients: {
						client_svr_customflow: {}
					}
				});

				return linker
					.run('client_svr_customflow.method')
					.then(function(data) {
						expect(
							data.httpproxyHeaders.httpproxycustomheader
						).to.be('httpproxyCustomHeader');
					});
			});
		});

		describe('#httpproxyQuery', function() {
			initTestSvrLinker({
				clients: {
					client_svr_customflow: {
						flows: ['it_customflow']
					}
				},
				customFlows: {
					it_customflow: function custom(runtime) {
						return {
							httpproxyQuery: runtime.env.httpproxyQuery
						};
					}
				}
			});

			it('#httpproxyQuery', function() {
				const linker = initLinker({
					httpproxyQuery: 'custom_query=xxxx',
					clients: {
						client_svr_customflow: {}
					}
				});

				return linker
					.run('client_svr_customflow.method')
					.then(function(data) {
						expect(data.httpproxyQuery.custom_query).to.be('xxxx');
					});
			});
		});
	});
});
