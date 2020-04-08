'use strict';

const Promise = require('bluebird');
const debug = require('debug')('clientlinker:flow');
const depFlow = require('./deps/dep_flow');

class Flow {
	constructor(name) {
		this.name = name;
	}

	run(runtime, callback) {
		debug('skip by no handler: %s', this.name);
		return callback.next();
	}

	methods() {
		debug('skip by no handler: %s', this.name);
		return Promise.resolve([]);
	}
}

exports.Flow = Flow;

depFlow.proto(Flow);
