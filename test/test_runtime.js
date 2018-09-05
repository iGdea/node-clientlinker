'use strict';

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


	it('#timline', function()
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
						var lastFlowTimline = runtime.lastFlow().timline;
						var timline = runtime.timline;

						expect(lastFlowTimline.start)
							.to.be.above(runtime.navigationStart-1);
						expect(lastFlowTimline.start - runtime.navigationStart)
							.to.be.below(10);

						expect(lastFlowTimline.start)
							.to.be.above(timline.flowsStart-1);
						expect(lastFlowTimline.start - timline.flowsStart)
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
				var timline = runtime.timline;
				var lastFlowTimline = runtime.lastFlow().timline;

				expect(timline.flowsEnd).to.be.above(lastFlowTimline.end-1);
				expect(timline.flowsEnd - lastFlowTimline.end)
					.to.be.below(10);

				expect(lastFlowTimline.start).to.be.above(timline.flowsStart);
				expect(lastFlowTimline.start - timline.flowsStart)
					.to.above(100-10);

				expect(lastFlowTimline.end).to.be.above(lastFlowTimline.start);
				expect(lastFlowTimline.end - lastFlowTimline.start)
					.to.be.above(100-10);
			});
	});

});
