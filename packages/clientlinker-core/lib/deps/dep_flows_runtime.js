'use strict';

let deprecate	= require('depd')('clientlinker:linker');

exports.proto = function(FlowsRuntime)
{
	let proto = FlowsRuntime.prototype;

	proto.getRunnedFlowByName = deprecate.function(proto.getFlowRuntime,
		'use `retry.getFlowRuntime` instead of `retry.getRunnedFlowByName`');

	Object.defineProperties(proto,
	{
		runnedFlows:
		{
			configurable: true,
			get: function() {return this.runned}
		}
	});

	deprecate.property(proto, 'runnedFlows',
		'use `retry.runned` instead of `retry.runnedFlows`');
};
