'use strict';

var Promise = require('bluebird');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;
var clientlinker = require('../');
var Runtime = require('../lib/runtime').Runtime;

function methodHandler(query, body, callback)
{
	query();
	callback && callback(null);
}

var linker = clientlinker(
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

linker.flow('confighandler', require('clientlinker-flow-confighandler'));

linker._newRuntime('client.method')
	.then(function(runtime)
	{
		suite.add('#only one promise run', function(deferred)
			{
				new Promise(function(resolve)
					{
						methodHandler(function(){'2,3'.split(',')}, null, resolve);
					})
					.then(deferred.resolve.bind(deferred));
			},
			{defer: true})

			.add('#clientlinker', function(deferred)
			{
				linker.run('client.method', function(){'2,3'.split(',')})
					.then(deferred.resolve.bind(deferred));
			},
			{defer: true})

			.add('#step runbyruntime', function(deferred)
			{
				var runtime2 = new Runtime(runtime.client, runtime.action,
					runtime.method, function(){'2,3'.split(',')}, {}, {});

				linker._runByRuntime(runtime2)
					.then(deferred.resolve.bind(deferred));
			},
			{defer: true})

			.add('#step newruntime', function(deferred)
			{
				linker._newRuntime('client.method', function(){'2,3'.split(',')})
					.then(deferred.resolve.bind(deferred));
			},
			{defer: true})

			.on('cycle', function(event)
			{
				console.log(String(event.target));
			})
			.on('complete', function()
			{
				console.log('Fastest is ' + this.filter('fastest').map('name'));
			})
			.run({async: true});
	});
