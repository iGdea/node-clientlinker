var assert				= require('assert');
var ClientLinker		= require('../');
var runClientHandler	= require('./runClientHandler');

describe('flows', function()
{
	it('localfile', function()
	{
		var linker = ClientLinker(
			{
				flows: ['localfile'],
				localfileDir: __dirname+'/localfile'
			});

		var promise1 = linker.run('client.js')
			.then(function(){assert(false)},
			function(err)
			{
				assert.equal(err.message, 'local file errmsg')
			});

		var promise2 = linker.run('client.json')
			.then(function(data)
			{
				assert.equal(data.string, 'string');
			});

		var promise3 = linker.methods()
			.then(function(list)
			{
				assert(list.client);
				var methods = Object.keys(list.client.methods);
				methods = methods.sort(function(a,b){return a > b});
				assert.equal(methods.join(), 'js,json');
				assert.equal(typeof list.client.methods.js[0], 'function');
			});

		return Promise.all([promise1, promise2, promise3]);
	});



	it('confighandler', function()
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clients: {
					client: {
						confighandler: require('./pkghandler/client')
					}
				}
			});

		var promise1 = runClientHandler(linker);
		var promise2 = linker.methods()
				.then(function(list)
				{
					assert(list.client);
					var methods = Object.keys(list.client.methods);
					methods = methods.sort(function(a,b){return a > b});
					assert.equal(methods.join(), 'method1,method2,method3');
					assert.equal(typeof list.client.methods.method1[0], 'function');
				});

		return Promise.all([promise1, promise2]);
	});


	it('pkghandler', function()
	{
		var linker = ClientLinker(
			{
				flows: ['pkghandler'],
				pkghandlerDir: __dirname+'/pkghandler'
			});

		var promise1 = runClientHandler(linker);
		var promise2 = linker.methods()
				.then(function(list)
				{
					assert(list.client);
					var methods = Object.keys(list.client.methods);
					methods = methods.sort(function(a,b){return a > b});
					assert.equal(methods.join(), 'method1,method2,method3');
					assert.equal(typeof list.client.methods.method1[0], 'function');
				});

		return Promise.all([promise1, promise2]);
	});

	it('logger', function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['logger', 'custom'],
				logger: function(runtime, err, data)
				{
					var timing = runtime.timing;
					assert(timing.lastFlowStart);
					assert(timing.lastFlowEnd);
					assert(timing.flowsStart);
					assert(timing.flowsEnd);
					assert(!err);
					assert.equal(data.respone, 'respone');
					done();
				},
				customFlows:
				{
					custom: function custom(runtime, callback)
					{
						callback(null, {respone: 'respone'});
					}
				},
				clients:
				{
					client: null
				}
			});

		linker.run('client.method', 123, {body:456}).catch(done);
	})
});
