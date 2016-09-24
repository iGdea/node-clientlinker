var Promise = require('bluebird');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;
var ClientLinker = require('../');
var Runtime = require('../lib/runtime').Runtime;

function methodHandler(query, body, callback)
{
	query();
	callback && callback(null);
}

var linker = ClientLinker(
	{
		flows: ['confighandler'],
		clients:
		{
			client:
			{
				confighandler:
				{
					method: methodHandler
				}
			}
		}
	});

linker._newRuntime('client.method')
	.then(function(runtime)
	{
		suite.add('#clientlinker', function(deferred)
			{
				linker.run('client.method', function(){'2,3'.split(',')})
					.then(function(data){deferred.resolve(data)},
						function(err){deferred.reject(err)});
			},
			{'defer': true})

			.add('#only one promise run', function(deferred)
			{
				new Promise(function(resolve, reject)
					{
						methodHandler(function(){'2,3'.split(',')}, null,
							function(err, data)
							{
								err ? reject(err) : resolve(data);
							});
					})
					.then(function(data){deferred.resolve(data)},
						function(err){deferred.reject(err)});
			},
			{'defer': true})

			.add('#rundirectly', function(deferred)
			{
				methodHandler(function(){'2,3'.split(',')}, null,
					function(err, data)
					{
						err ? deferred.reject(err) : deferred.resolve(data);
					});
			},
			{'defer': true})

			.add('#run sync', function()
			{
				var deferred = {};
				methodHandler(function(){'2,3'.split(',')}, function(err, data)
				{
					err ? deferred.reject(err) : deferred.resolve(data);
				}, null);
			})

			.add('#step runbyruntime', function(deferred)
			{
				var runtime2 = new Runtime(runtime.client, runtime.action,
					runtime.method, function(){'2,3'.split(',')}, {}, {});

				linker._runByRuntime(runtime2)
					.then(function(data){deferred.resolve(data)},
						function(err){deferred.reject(err)});
			},
			{'defer': true})

			.add('#step newruntime', function(deferred)
			{
				linker._newRuntime('client.method', function(){'2,3'.split(',')})
					.then(function(data){deferred.resolve(data)},
						function(err){deferred.reject(err)});
			},
			{'defer': true})

			.on('cycle', function(event)
			{
				console.log(String(event.target));
			})
			.on('complete', function()
			{
				console.log('Fastest is ' + this.filter('fastest').map('name'));
			})
			.run({ 'async': true });
	});
