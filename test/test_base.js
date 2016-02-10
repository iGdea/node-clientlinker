require('debug').enable('client_linker*');
var ClientLinker = require('../');
var assert = require('assert');

describe('init', function()
{
	it('ownlist', function()
	{
		assert(ClientLinker.supportMiddlewares.length > 0);
		assert(ClientLinker.supportMiddlewares.indexOf('httpproxy') != -1);
	});

	it('own', function()
	{
		var linker = ClientLinker(
			{
				flows: ClientLinker.supportMiddlewares
			});

		var noHiproto = !linker.flows['hiproto'];
		assert.equal(Object.keys(linker.flows).length, ClientLinker.supportMiddlewares.length+(noHiproto ? -1 : 0));
		ClientLinker.supportMiddlewares.forEach(function(name)
		{
			if (name != 'hiproto' || !noHiproto)
			{
				assert.equal(typeof linker.flows[name], 'function');
			}
		});
	});

	it('custom', function()
	{
		var linker = ClientLinker(
			{
				flows: ['custom', 'custom2'],
				customFlows: {
					custom: function custom(){}
				}
			});

		assert.equal(Object.keys(linker.flows).length, 1);
	});

	it('clientrun', function(done)
	{
		// this.timeout(60*1000);
		var runned = false;
		var linker = ClientLinker(
			{
				flows: ['custom'],
				customFlows:
				{
					custom: function custom(args, callback)
					{
						runned = true;
						callback();
					}
				}
			});

		linker.add('client', {flows: ['custom']});
		linker.run('client.xxxx', null, null, function(err)
		{
			assert(!err);
			assert(runned);
			done();
		});
	});

	it('timing', function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['assertHandler', 'custom1', 'custom2'],
				customFlows:
				{
					custom1: function custom1(args, callback)
					{
						setTimeout(callback.next, 100);
					},
					custom2: function custom2(args, callback)
					{
						setTimeout(callback, 100);
					},
					assertHandler: function assertHandler(args, callback)
					{
						var timing = args.timing;
						assert(timing.lastFlowStart - timing.navigationStart < 10);
						assert.equal(timing.lastFlowStart, timing.flowsStart);

						var promise = callback.next();
						promise.then(function()
						{
							setTimeout(function()
							{
								assert.equal(timing.lastFlowEnd, timing.flowsEnd);
								assert(timing.lastFlowStart - timing.flowsStart >= 100);
								assert(timing.lastFlowEnd - timing.lastFlowStart >= 100);
								done();
							}, 20);
						});
					}
				},
				clients: {
					client: {
						method: null
					}
				}
			});

		linker.run('client.method').catch(done);
	});
});
