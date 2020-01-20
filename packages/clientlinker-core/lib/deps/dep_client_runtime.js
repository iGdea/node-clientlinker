'use strict';

let deprecate = require('depd')('clientlinker:client_runtime');

exports.proto = function(Runtime) {
	let proto = Runtime.prototype;
	Object.defineProperties(proto, {
		runOptions: {
			configurable: true,
			get: function() {
				return this.options;
			},
			set: function(val) {
				this.options = val;
			}
		},
		methodKey: {
			configurable: true,
			get: function() {
				return this.action;
			},
			set: function(val) {
				this.action = val;
			}
		}
	});

	deprecate.property(
		proto,
		'runOptions',
		'use `runtime.options` instead of `runtime.runOptions`'
	);
	deprecate.property(
		proto,
		'methodKey',
		'use `runtime.action` instead of `runtime.methodKey`'
	);
	proto.lastFlow = deprecate.function(
		proto.getLastRunner,
		'use `runtime.getLastRunner()` instead of `runtime.lastFlow`'
	);
};
