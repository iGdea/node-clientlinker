'use strict';

const PromiseMap = require('p-map');
const fs = require('fs').promises;
const vm = require('vm');
const debug = require('debug')('clientlinker-flow-localfile');

exports = module.exports = localfile;

function localfile(runtime, callback) {
	const client = runtime.client;
	const options = client.options;

	if (!options.localfile) return callback.next();

	const file = options.localfile + '/' + runtime.method;

	return checkExists(file, ['js', 'json']).then(function(exists) {
		const fileInfo = exists[0];
		if (!fileInfo) return callback.next();

		return fs.readFile(fileInfo.file, { encoding: 'utf8' })
			.then(function(content) {
				return parseContent(client.linker, content, fileInfo.extname);
			})
			.then(function(data) {
				if (!data) throw data;
				else if (data.result) throw data.result;
				else return data.data;
			});
	});
}

function checkExists(file, extnames) {
	return PromiseMap(
		extnames,
		function(extname) {
			const thisFile = file + '.' + extname;

			return fs.stat(thisFile).then(
				function(stats) {
					if (stats.isFile())
						return { extname: extname, file: thisFile };
				},
				function(err) {
					debug('file stat err, file: %s, err: %o', thisFile, err);
				}
			);
		},
		{
			concurrency: 5
		}
	).then(function(exists) {
		return exists.filter(function(item) {
			return !!item;
		});
	});
}

exports.parseContent = parseContent;
function parseContent(linker, content, extname) {
	if (extname == 'json') {
		return JSON.parse(content);
	} else {
		const data = { module: { exports: {} } };
		vm.runInNewContext(content, data);
		return data.module.exports;
	}
}
