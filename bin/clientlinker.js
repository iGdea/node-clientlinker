#!/usr/bin/env node
'use strict';
process.title = 'clientlinker';

var path		= require('path');
var printTable	= require('./print_table').printTable;
var rl			= require('./rl');
var runArgv		= require('./run_argv');
var debug		= require('debug')('client_linker:bin');

var pkg = process.argv[2] || '';
if (process.env.HOME && /^~[\/\\]/.test(pkg))
{
	pkg = path.resolve(process.env.HOME, pkg);
}
var linker = require(path.resolve(pkg));


var clients = linker.clients;
function clientReady()
{
	return clients.then(function(list)
		{
			if (linker.clients !== clients)
			{
				clients = linker.clients;
				return clientReady();
			}
			else
			{
				return list;
			}
		});
}


clientReady()
	.then(function(list)
	{
		return linker.methods()
			.then(function(list)
			{
				var allMethods = runArgv.getAllMethods(list);
				if (allMethods.length)
				{
					if (!runArgv.runActionByArgv(linker, allMethods))
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

