"use strict";

var Promise = require('bluebird');
var readline = require('readline');

var rl = readline.createInterface(
	{
		input: process.stdin,
		output: process.stdout
	});


exports.rl = rl;
exports.question = function(title)
{
	return new Promise(function(resolve)
		{
			rl.question(title, function(str)
				{
					resolve(str);
				});
		});
};

