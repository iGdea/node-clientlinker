'use strict';

var _		= require('lodash');
var Promise	= require('bluebird');
var debug	= require('debug')('clientlinker:flow');
var depFlow	= require('./deps/dep_flow');

exports.Flow = Flow;

function Flow(name)
{
	this.name = name;
}

_.extend(Flow.prototype,
{
	run: function(runtime, callback)
	{
		debug('skip by no handler: %s', this.name);
		return callback.next();
	},
	methods: function()
	{
		debug('skip by no handler: %s', this.name);
		return Promise.resolve([]);
	},
});

depFlow.proto(Flow);
