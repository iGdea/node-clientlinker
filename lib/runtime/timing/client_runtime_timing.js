'use strict';

var _			= require('lodash');
var deprecate	= require('depd')('clientlinker:client_runtime_timing');

exports.Timing = Timing;
function Timing(runtime)
{
	this.runtime = runtime;
}

var proto = Timing.prototype;
_.extend(proto,
{
	getStartTime: function()
	{
		var firstRtry = this.runtime.retry[0];
		return firstRtry && firstRtry.timing.getStartTime();
	},
	getEndTime: function()
	{
		var lastTry = this.runtime.lastTry;
		return lastTry && lastTry.timing.getEndTime();
	}
});

Object.defineProperties(proto,
{
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
		get: function() {return this.runtime.navigationStart}
	}
});

deprecate.property(proto, 'navigationStart',
	'use `runtime.navigationStart` instead of `timing.navigationStart`');
deprecate.property(proto, 'flowsStart',
	'use `timing.getStartTime()` instead of `timing.flowsStart`');
deprecate.property(proto, 'flowsEnd',
	'use `timing.getEndTime()` instead of `timing.flowsEnd`');
