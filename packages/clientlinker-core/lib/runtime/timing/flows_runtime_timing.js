'use strict';

var _			= require('lodash');
var deprecate	= require('depd')('clientlinker:client_runtime_timing');

exports.Timing = Timing;
function Timing(onetry)
{
	this.onetry = onetry;
}

var proto = Timing.prototype;
_.extend(proto,
{
	getStartTime: function()
	{
		var firstRunner = this.onetry.runned[0];
		return firstRunner && firstRunner.startTime;
	},
	getEndTime: function()
	{
		if (!this.onetry.finished) return;
		var lastRunner = this.onetry.lastRunner;
		return lastRunner && lastRunner.endTime;
	},
	toJSON: function()
	{
		return {
			startTime: this.getStartTime(),
			endTime: this.getEndTime()
		};
	}
});

Object.defineProperties(proto,
{
	startTime:
	{
		get: function() {return this.getStartTime()}
	},
	endTime:
	{
		get: function() {return this.getEndTime()}
	},
	flowsStart:
	{
		configurable: true,
		get: function() {return this.getStartTime()}
	},
	flowsEnd:
	{
		configurable: true,
		get: function() {return this.getEndTime()}
	},
	navigationStart:
	{
		configurable: true,
		get: function() {return this.onetry.runtime.navigationStart}
	}
});

deprecate.property(proto, 'navigationStart',
	'use `runtime.navigationStart` instead of `try.timing.navigationStart`');
deprecate.property(proto, 'flowsStart',
	'use `timing.getStartTime()` instead of `timing.flowsStart`');
deprecate.property(proto, 'flowsEnd',
	'use `timing.getEndTime()` instead of `timing.flowsEnd`');
