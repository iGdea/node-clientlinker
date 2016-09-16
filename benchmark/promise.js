var Promise = require('bluebird');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;


suite.add('#directly', function()
	{
		'1,2,3'.split(',')
	})

	.add('#promise1', function(deferred)
	{
		new Promise(function(resolve)
			{
				'1,2,3'.split(',')
				resolve();
			})
			.then(function(data){deferred.resolve(data)},
				function(err){deferred.reject(err)});
	},
	{'defer': true})

	.add('#promise2', function(deferred)
	{
		Promise.resolve()
			.then(function()
			{
				'1,2,3'.split(',')
			})
			.then(function(data){deferred.resolve(data)},
				function(err){deferred.reject(err)});
	},
	{'defer': true})

	.add('#promise3', function(deferred)
	{
		Promise.resolve()
			.then(function(){return Promise.resolve()})
			.then(function()
			{
				'1,2,3'.split(',')
			})
			.then(function(data){deferred.resolve(data)},
				function(err){deferred.reject(err)});
	},
	{'defer': true})

	.add('#promise4', function(deferred)
	{
		Promise.resolve()
			.then(function(){return Promise.resolve()})
			.then(function(){return Promise.resolve()})
			.then(function()
			{
				'1,2,3'.split(',')
			})
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
