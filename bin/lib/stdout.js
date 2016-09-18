"use strict";

var fs = require('fs');
var util = require('util');
var logStdout = process.stdout;

exports.is_verbose = process.env.LOG_VERBOSE == 'true';

'log|warn|error|info|verbose'.split('|').forEach(function(name)
	{
		exports[name] = function()
		{
			if (name != 'verbose' || exports.is_verbose)
			{
				var str = util.format.apply(null, arguments) + '\n';
				logStdout.write(str);
			}
		}

		console[name] = function()
		{
			if (exports.is_verbose)
			{
				var str = util.format.apply(null, arguments) + '\n';
				logStdout.write(str);
			}
		}
	});
