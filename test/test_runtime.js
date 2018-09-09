'use strict';

var Promise			= require('bluebird');
var clientlinker	= require('../');
var expect			= require('expect.js');


describe('#runtime', function()
{
	it('#runtime of retPromise', function()
	{
		var linker = clientlinker();
		linker.addClient('client');

		var retPromise = linker.run('client.method');
		var runtime = linker.lastRuntime;

		return retPromise
			.then(function(){expect().fail()},
				function()
				{
					expect(runtime).to.be.an('object');
					expect(runtime.navigationStart).to.be.a('number');
				});
	});


	it('#env of runtime', function()
	{
		var linker = clientlinker();
		linker.addClient('client');

		var retPromise1 = linker.run('client.method');
		var runtime1 = linker.lastRuntime;
		var promise1 = retPromise1
			.then(function(){expect().fail()},
				function()
				{
					expect(runtime1.env.source).to.be('run');
				});

		var retPromise2 = linker.runInShell('client.method');
		var runtime2 = linker.lastRuntime;
		var promise2 = retPromise2
			.then(function(){expect().fail()},
				function()
				{
					expect(runtime2.env.source).to.be('shell');
				});

		return Promise.all([promise1, promise2]);
	});


	it('#timing', function()
	{
		var linker = clientlinker(
		{
			flows: ['assertHandler', 'custom1', 'custom2'],
			customFlows:
			{
				custom1: function custom1(runtime, callback)
				{
					setTimeout(callback.nextAndResolve.bind(callback), 100);
				},
				custom2: function custom2(runtime, callback)
				{
					setTimeout(callback.callback.bind(callback), 100);
				},
				assertHandler: function assertHandler(runtime, callback)
				{
					var lastRunnerTiming = runtime.lastFlow().timing;
					var timing = runtime.timing;

					expect(lastRunnerTiming.start)
						.to.be.above(runtime.navigationStart-1);
					expect(lastRunnerTiming.start - runtime.navigationStart)
						.to.be.below(10);

					expect(lastRunnerTiming.start).to.be(timing.flowsStart);

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
		var runtime = linker.lastRuntime;

		return retPromise.then(function()
		{
			var timing = runtime.timing;
			var lastRunnerTiming = runtime.lastFlow().timing;

			expect(timing.flowsEnd).to.be(lastRunnerTiming.end);
			expect(lastRunnerTiming.start).to.be(timing.flowsStart);
		});
	});

});
