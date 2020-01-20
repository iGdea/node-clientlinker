'use strict';

let Promise = require('bluebird');
let Benchmark = require('benchmark');
let suite = new Benchmark.Suite;
let clientlinker = require('../');

function methodHandler(query, body, callback)
{
	query();
	callback && callback(null);
}

let linker = clientlinker(
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

linker.flow('confighandler', require('clientlinker-flow-confighandler-test').flows.confighandler);


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

	.on('cycle', function(event)
	{
		console.log(String(event.target));
	})
	.on('complete', function()
	{
		console.log('Fastest is ' + this.filter('fastest').map('name'));
	})
	.run({async: true});
