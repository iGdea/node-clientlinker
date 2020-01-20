'use strict';

let Promise = require('bluebird');
let expect = require('expect.js');
let commandActions = require('../bin/lib/command_actions');
let printTable = require('../bin/lib/print_table');
let printTpl = require('../bin/lib/print_tpl');

let CONFIG_FILE = __dirname + '/conf/simple.conf.js';
let EMPTY_CONFIG_FILE = __dirname + '/conf/empty.conf.js';

require('../bin/lib/rlutils').colors.enabled = false;

describe('#commandActions', function() {
	it('#runAction', function() {
		let linker = require(CONFIG_FILE);

		return Promise.all([
			commandActions.runAction(linker, 'client.success'),
			commandActions.runAction(linker, 'client.error').then(
				function() {
					expect().fail();
				},
				function(err) {
					expect(err).to.be(undefined);
				}
			)
		]);
	});

	describe('#listAction', function() {
		it('#base', function() {
			let output = [
				'    client               confighandler    pkghandler   ',
				' 1  error                confighandler $               ',
				' 2  error2               confighandler $               ',
				' 3  success              confighandler $               ',
				'                                                       ',
				'    client2              confighandler    pkghandler   ',
				' 4  method               confighandler $               ',
				' 5  method1                               pkghandler $ ',
				' 6  method2              confighandler $  pkghandler $ ',
				'                                                       ',
				'    client3              confighandler    pkghandler   ',
				'    ** No Methods **                                   ',
				''
			]
				.join('\n')
				.replace(/\$/g, printTable.useSymbole);

			return commandActions
				.listAction(CONFIG_FILE, {})
				.then(function(data) {
					expect(data.output.split('\n')).to.eql(output.split('\n'));
				});
		});

		it('#clients options', function() {
			let output = [
				'    client2     confighandler    pkghandler   ',
				' 1  method      confighandler $               ',
				' 2  method1                      pkghandler $ ',
				' 3  method2     confighandler $  pkghandler $ ',
				''
			]
				.join('\n')
				.replace(/\$/g, printTable.useSymbole);

			return commandActions
				.listAction(CONFIG_FILE, {
					clients: 'client2'
				})
				.then(function(data) {
					expect(data.output.split('\n')).to.eql(output.split('\n'));
				});
		});

		it('#clients width useAction', function() {
			let output = [
				'    client2             confighandler    pkghandler   ',
				' 1  client2.method      confighandler $               ',
				' 2  client2.method1                      pkghandler $ ',
				' 3  client2.method2     confighandler $  pkghandler $ ',
				''
			]
				.join('\n')
				.replace(/\$/g, printTable.useSymbole);

			return commandActions
				.listAction(CONFIG_FILE, {
					clients: 'client2',
					useAction: true
				})
				.then(function(data) {
					expect(data.output.split('\n')).to.eql(output.split('\n'));
				});
		});

		it('#no methods', function() {
			return commandActions.listAction(EMPTY_CONFIG_FILE, {}).then(
				function() {
					expect().fail();
				},
				function(err) {
					expect(err.message).to.be('No Client Has Methods');
				}
			);
		});

		it('#flows options', function() {
			let output = [
				'    client      confighandler   ',
				' 1  error       confighandler $ ',
				' 2  error2      confighandler $ ',
				' 3  success     confighandler $ ',
				''
			]
				.join('\n')
				.replace(/\$/g, printTable.useSymbole);

			return commandActions
				.listAction(CONFIG_FILE, {
					clients: 'client',
					flows: 'not_exists_flow, confighandler'
				})
				.then(function(data) {
					expect(data.output.split('\n')).to.eql(output.split('\n'));
				});
		});
	});

	describe('#execAction', function() {
		it('#run suc', function() {
			return Promise.all([
				commandActions.execAction(CONFIG_FILE, 'client.success', {}),
				commandActions.execAction(CONFIG_FILE, '5', {}),
				commandActions.execAction(CONFIG_FILE, 5, {})
			]);
		});

		it('#run err', function() {
			let promise1 = commandActions
				.execAction(CONFIG_FILE, 'client.error', {})
				.then(
					function() {
						expect().fail();
					},
					function(err) {
						expect(err).to.be(undefined);
					}
				);

			let promise2 = commandActions
				.execAction(CONFIG_FILE, 'client.error2', {})
				.then(
					function() {
						expect().fail();
					},
					function(err) {
						expect(err).to.be('errmsg');
					}
				);

			return Promise.all([promise1, promise2]);
		});

		it('#no methods err', function() {
			return commandActions.execAction(EMPTY_CONFIG_FILE, 1, {}).then(
				function() {
					expect().fail();
				},
				function(err) {
					expect(err.message).to.be('No Client Has Methods');
				}
			);
		});

		it('#no action err', function() {
			return commandActions.execAction(CONFIG_FILE, 9999, {}).then(
				function() {
					expect().fail();
				},
				function(err) {
					expect(err.message).to.be('Not Found Action');
				}
			);
		});
	});

	it('#parseFilterFlows', function() {
		let allFlows = ['flow1', 'flow2', 'flow3'];

		let items = commandActions.parseFilterFlows('flow1, flow3,', allFlows);
		expect(items).to.be.eql(['flow1', 'flow3']);

		items = commandActions.parseFilterFlows('flow1,', allFlows);
		expect(items).to.be.eql(['flow1']);

		items = commandActions.parseFilterFlows('flow4,', allFlows);
		expect(items).to.be.eql(allFlows);
	});
});

describe('#printTpl', function() {
	it('#runActionUnexpectedError', function() {
		expect(printTpl.runActionUnexpectedError('action', 'errmsg')).to.be(
			'\n ========= Unexpected Error action ========= \n\'errmsg\''
		);
	});

	it('#rlRunHeader', function() {
		printTpl.rlRunHeader();
	});
});
