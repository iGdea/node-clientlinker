"use strict";

var path		= require('path');
var printTable	= require('./lib/print_table').printTable;
var rl			= require('./lib/rl');
var runArgv		= require('./lib/run_argv');
var debug		= require('debug')('clientlinker:bin');
var parsed		= require('nopt')(
	{
		'linker'		: path,
		'clk-action'	: String,
		'clk-query'		: String,
		'clk-body'		: String,
		'clk-options'	: String,
		'action'		: String,
		'query'			: String,
		'body'			: String,
		'options'		: String,
	});

var pkg = process.argv[2];
if (!parsed.linker && pkg && pkg[0] != '-')
{
	if (process.env.HOME && /^~[\/\\]/.test(pkg))
		pkg = path.resolve(process.env.HOME, pkg);
	else
		pkg = path.resolve(pkg);

	parsed.linker = pkg;
}


if (parsed.linker)
{
	var linker = require(parsed.linker);

	linker.clients()
		.then(function()
		{
			return linker.methods()
				.then(function(list)
				{
					var allMethods = runArgv.getAllMethods(list);
					if (allMethods.length)
					{
						if (!runArgv.runActionByArgv(linker, parsed, allMethods))
						{
							printTable(allMethods.lines, allMethods.allFlowFrom);
							rl.testStart(allMethods, linker);
						}
					}
					else
					{
						console.error('  ** No Client has Methods **   ');
					}
				});
		})
		.catch(function(err)
		{
			console.log(err.stack);
		});
}
else
{
	console.log('Usage:');
	console.log('[List] clientlinker ./config/clientlinker.conf.js');
	console.log('[List] clientlinker --linker=./config/clientlinker.conf.js');
	console.log('[Run]  clientlinker --linker=./config/clientlinker.conf.js --action=xxx --query=xxx --body=xxxx --options=xxxxx');
}
