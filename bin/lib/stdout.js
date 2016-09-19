"use strict";

var Promise		= require('bluebird');
var fs			= require('fs');
var util		= require('util');
var logStdout	= process.stdout;

exports.is_verbose = true;
exports.promise = Promise.resolve();

var iswriting = false;

'log|warn|error|info|verbose'.split('|').forEach(function(name)
	{
		exports[name] = function()
		{
			if (name != 'verbose' || exports.is_verbose)
			{
				var str = util.format.apply(null, arguments) + '\n';
				writelog(str);
			}
		}

		console[name] = function()
		{
			if (exports.is_verbose)
			{
				var str = util.format.apply(null, arguments) + '\n';
				writelog(str);
			}
		}
	});


function writelog(str)
{
	var ok = logStdout.write(str);
	if (!ok && !iswriting)
	{
		iswriting = true;
		exports.promise = new Promise(function(resolve)
		{
			logStdout.once('drain', function()
				{
					iswriting = false;
					resolve();
				});
		});
	}
}
