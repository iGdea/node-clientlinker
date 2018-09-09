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
		var firstRunner = this.runtime.getFirstRunner();
		return firstRunner && firstRunner.startTime;
	},
	getEndTime: function()
	{
		if (!this.runtime.isFinished()) return;
		var lastRunner = this.runtime.getLastRunner();
		return lastRunner && lastRunner.endTime;
	}
});

Object.defineProperties(proto,
{
	flowsStart:
	{
		configurable: true,
		get: function()
		{
			return this.getStartTime();
		}
	},
	flowsEnd:
	{
		configurable: true,
		get: function()
		{
			return this.getEndTime();
		}
	},
	navigationStart:
	{
		configurable: true,
		get: function()
		{
			return this.runtime.navigationStart;
		}
	}
});

deprecate.property(proto, 'navigationStart',
	'use `runtime.navigationStart` instead of `timing.navigationStart`');
deprecate.property(proto, 'flowsStart',
	'use `timing.getStartTime()` instead of `timing.flowsStart`');
deprecate.property(proto, 'flowsEnd',
	'use `timing.getEndTime()` instead of `timing.flowsEnd`');
