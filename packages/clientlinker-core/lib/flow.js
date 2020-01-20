'use strict';

let _ = require('lodash');
let Promise = require('bluebird');
let debug = require('debug')('clientlinker:flow');
let depFlow = require('./deps/dep_flow');

exports.Flow = Flow;

function Flow(name) {
	this.name = name;
}

_.extend(Flow.prototype, {
	run: function(runtime, callback) {
		debug('skip by no handler: %s', this.name);
		return callback.next();
	},
	methods: function() {
		debug('skip by no handler: %s', this.name);
		return Promise.resolve([]);
	}
});

depFlow.proto(Flow);
