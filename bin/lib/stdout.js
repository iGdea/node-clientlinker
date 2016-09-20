"use strict";

var Promise		= require('bluebird');
var fs			= require('fs');
var util		= require('util');

exports.is_verbose = true;
exports.promise = Promise.resolve();
exports.stdout = process.stdout;

var iswriting = false;

'log|warn|error|info|verbose'.split('|').forEach(function(name)
	{
		exports[name] = function()
		{
			if (name != 'verbose' || exports.is_verbose)
			{
				var str = util.format.apply(null, arguments) + '\n';
				exports.write(str);
			}
		}

		console[name] = function()
		{
			if (exports.is_verbose)
			{
				var str = util.format.apply(null, arguments) + '\n';
				exports.write(str);
			}
		}
	});


exports.write = write;
function write(str)
{
	var ok = exports.stdout.write(str);

	if (!ok && !iswriting)
	{
		iswriting = true;
		exports.promise = new Promise(function(resolve)
		{
			exports.stdout.once('drain', function()
				{
					iswriting = false;
					resolve();
				});
		});
	}

	return ok;
}
