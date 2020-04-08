/* global Promise */

'use strict';

const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

suite
	.add('#directly', function() {
		'1,2,3'.split(',');
	})
	.on('cycle', function(event) {
		console.log(String(event.target));
	})
	.on('complete', function() {
		console.log('Fastest is ' + this.filter('fastest').map('name'));
	});

addPromiseCases('native', Promise);
addPromiseCases('bluebird', require('bluebird'));

suite.run({ async: true });

function addPromiseCases(name, Promise) {
	suite
		.add(
			'#' + name + ' promise1',
			function(deferred) {
				new Promise(function(resolve) {
					'1,2,3'.split(',');
					resolve();
				}).then(deferred.resolve.bind(deferred));
			},
			{ defer: true }
		)

		.add(
			'#' + name + ' promise2',
			function(deferred) {
				Promise.resolve()
					.then(function() {
						'1,2,3'.split(',');
					})
					.then(deferred.resolve.bind(deferred));
			},
			{ defer: true }
		)

		.add(
			'#' + name + ' promise3',
			function(deferred) {
				Promise.resolve()
					.then(function() {
						return Promise.resolve();
					})
					.then(function() {
						'1,2,3'.split(',');
					})
					.then(deferred.resolve.bind(deferred));
			},
			{ defer: true }
		)

		.add(
			'#' + name + ' promise4',
			function(deferred) {
				Promise.resolve()
					.then(function() {
						return Promise.resolve();
					})
					.then(function() {
						return Promise.resolve();
					})
					.then(function() {
						'1,2,3'.split(',');
					})
					.then(deferred.resolve.bind(deferred));
			},
			{ defer: true }
		);
}
