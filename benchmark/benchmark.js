var Promise = require('bluebird');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;
var ClientLinker = require('../');

function methodHandler(query, body, callback)
{
	query();
	callback(null);
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

			.add('#rundirectly', function(deferred)
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

			.add('#step runbyruntime', function(deferred)
			{
				runtime.query = function(){'2,3'.split(',')};

				linker._runByRuntime(runtime)
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
