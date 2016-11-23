"use strict";

var Promise			= require('bluebird');
var ClientLinker	= require('../');
var expect			= require('expect.js');


describe('#runtime', function()
{
	it('#runtime of retPromise', function()
	{
		var linker = ClientLinker();
		linker.addClient('client');

		var retPromise = linker.run('client.method');

		return retPromise
			.then(function(){expect().fail()},
				function()
				{
					var runtime = retPromise.runtime;
					expect(runtime).to.be.an('object');
					expect(runtime.navigationStart).to.be.a('number');

					return retPromise.runtimePromise
						.then(function(runtime2)
						{
							expect(runtime2).to.be.an('object');
							expect(runtime2.navigationStart).to.be.a('number');
							expect(runtime2).to.be.eql(runtime);
						});
				});
	});


	it('#env of runtime', function()
	{
		var linker = ClientLinker();
		linker.addClient('client');

		var retPromise1 = linker.run('client.method');
		var promise1 = retPromise1
			.then(function(){expect().fail()},
				function()
				{
					var runtime = retPromise1.runtime;
					expect(runtime.env.source).to.be('run');
				});

		var retPromise2 = linker.runInShell('client.method');
		var promise2 = retPromise2
			.then(function(){expect().fail()},
				function()
				{
					var runtime = retPromise2.runtime;
					expect(runtime.env.source).to.be('shell');
				});

		return Promise.all([promise1, promise2]);
	});


	it('#timing', function()
	{
		var linker = ClientLinker(
			{
				flows: ['assertHandler', 'custom1', 'custom2'],
				customFlows:
				{
					custom1: function custom1(runtime, callback)
					{
						setTimeout(callback.nextAndResolve, 100);
					},
					custom2: function custom2(runtime, callback)
					{
						setTimeout(callback, 100);
					},
					assertHandler: function assertHandler(runtime, callback)
					{
						var lastFlowTiming = runtime.lastFlow().timing;
						var timing = runtime.timing;

						expect(lastFlowTiming.start)
							.to.be.above(runtime.navigationStart-1);
						expect(lastFlowTiming.start - runtime.navigationStart)
							.to.be.below(10);

						expect(lastFlowTiming.start)
							.to.be.above(timing.flowsStart-1);
						expect(lastFlowTiming.start - timing.flowsStart)
							.to.below(10);

						return callback.next();
					}
				},
				clients: {
					client: {
						method: null
					}
				}
			});

		var retPromise = linker.run('client.method');

		return retPromise.then(function()
			{
				var runtime = retPromise.runtime;
				var timing = runtime.timing;
				var lastFlowTiming = runtime.lastFlow().timing;

				expect(timing.flowsEnd).to.be.above(lastFlowTiming.end-1);
				expect(timing.flowsEnd - lastFlowTiming.end)
					.to.be.below(10);

				expect(lastFlowTiming.start).to.be.above(timing.flowsStart);
				expect(lastFlowTiming.start - timing.flowsStart)
					.to.above(100-10);

				expect(lastFlowTiming.end).to.be.above(lastFlowTiming.start);
				expect(lastFlowTiming.end - lastFlowTiming.start)
					.to.be.above(100-10);
			});
	});

});
