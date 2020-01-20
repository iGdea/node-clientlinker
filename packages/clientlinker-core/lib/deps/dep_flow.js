'use strict';

let deprecate = require('depd')('clientlinker:flow');
let debug = require('debug')('clientlinker:flow-dep');

exports.proto = function(Flow) {
	let proto = Flow.prototype;

	proto.register = deprecate.function(function(registerName, handler) {
		let registerNameType = typeof registerName;
		if (registerNameType == 'function') {
			handler = registerName;
			registerName = 'process';
		} else if (registerNameType != 'string') {
			throw new Error(
				'CLIENTLINKER:FlowRegisterNameMustBeString/Function'
			);
		} else if (typeof handler != 'function') {
			handler = null;
		}

		debug(
			'register flow, name: %s registerName:%s',
			this.name,
			registerName
		);

		switch (registerName) {
			case 'methods':
				this.methods = handler;
				break;

			case 'process':
				this.run = handler;
				break;

			default:
				debug('undefined registerName:%s', registerName);
		}
	}, '`flow.register` is will remove');
};
