'use strict';

var deprecate	= require('depd')('clientlinker:flow_runtime_timing');

exports.Timing = Timing;
function Timing(runner)
{
	this.runner = runner;
}

var proto = Timing.prototype;

Object.defineProperties(proto,
{
	startTime:
	{
		get: function() {return this.runner.startTime}
	},
	endTime:
	{
		get: function() {return this.runner.endTime}
	},
	start:
	{
		configurable: true,
		get: function() {return this.runner.startTime}
	},
	end:
	{
		configurable: true,
		get: function() {return this.runner.endTime}
	},
	navigationStart:
	{
		configurable: true,
		get: function() {return this.runner.runtime.navigationStart}
	}
});

deprecate.property(proto, 'navigationStart',
	'use `runtime.navigationStart` instead of `runner.timing.navigationStart`');
deprecate.property(proto, 'start',
	'use `runner.startTime` instead of `runner.timing.start`');
deprecate.property(proto, 'end',
	'use `runner.endTime` instead of `runner.timing.end`');
