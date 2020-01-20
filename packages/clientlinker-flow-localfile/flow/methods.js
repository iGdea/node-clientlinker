'use strict';

let Promise = require('bluebird');
let fs = Promise.promisifyAll(require('fs'));
let debug = require('debug')('clientlinker-flow-localfile:methods');

module.exports = methods;
function methods(client) {
	let pathdir = client.options.localfile;
	if (!pathdir) return;

	return fs.readdirAsync(pathdir).then(
		function(dirs) {
			return Promise.map(
				dirs,
				function(filename) {
					if (filename[0] == '.') return;

					let arr = filename.split('.');
					let extname = arr.pop();
					if (extname == 'json' || extname == 'js') {
						return fs.statAsync(pathdir + '/' + filename).then(
							function(stats) {
								if (stats.isFile()) return arr.join('.');
							},
							function() {}
						);
					}
				},
				{
					concurrency: 5
				}
			).then(function(methods) {
				return methods.filter(function(method) {
					return method;
				});
			});
		},
		function(err) {
			debug('readdir err, dir: %s, err: %o', pathdir, err);
		}
	);
}
