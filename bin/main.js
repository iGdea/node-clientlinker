"use strict";

var path		= require('path');
var rlutils		= require('./lib/rlutils');
var printTable	= require('./lib/print_table').printTable;
var runRl		= require('./lib/run_rl');
var debug		= require('debug')('clientlinker:bin');
var Command		= require('./lib/command').Command;

// rlutils.colors.enabled = false;
var command = new Command;

command.list()
	.action(function(conf_file, options)
	{
		printAndRunMethos(conf_file, options, false);
	});

command.exec()
	.action(function(conf_file, action, options)
	{
		var linker = require(rlutils.resolve(conf_file));

		filterAllMehtods(linker, options.filterClient)
			.then(function(allMethods)
			{
				if (allMethods.length)
				{
					var realaction = rlutils.parseAction(action, allMethods);
					if (realaction)
					{
						rlutils.run(linker, realaction,
								rlutils.parseParam(linker, options.clkQuery),
								rlutils.parseParam(linker, options.clkBody),
								rlutils.parseParam(linker, options.clkOptions)
							);
					}
					else
						console.error('   ** No Action %s **   ', rlutils.colors.red(action));
				}
				else
					console.error('   ** No Client has Methods **   ');
			})
			.catch(function(err)
			{
				console.log(err.stack);
			});
	})
	// .on('--help', function()
	// {
	// 	console.log('  Tips: Optons data > string > file');
	// 	console.log('');
	// });

command.run()
	.action(function(conf_file, options)
	{
		printAndRunMethos(conf_file, options, true);
	});

command.help()
	.action(function()
	{
		process.exit();
	});

// 默认输出帮助信息
command.program
	.command('*', null, {noHelp: true})
	.action(function()
	{
		this.parent.help();
	});


if (process.argv.length < 3)
	process.argv.push('--help');

command.program.parse(process.argv);






/****** utils *******/
function printAndRunMethos(conf_file, options, isRunRl)
{
	var linker = require(rlutils.resolve(conf_file));

	filterAllMehtods(linker, options.filterClient)
		.then(function(allMethods)
		{
			if (allMethods.length)
			{
				var output = printTable(allMethods.lines, allMethods.allFlowFrom);
				console.log(output);
				if (isRunRl) runRl.start(allMethods, linker);
			}
			else
				console.error('  ** No Client has Methods **   ');
		})
		.catch(function(err)
		{
			console.log(err.stack);
		});
}

function filterAllMehtods(linker, clients)
{
	return linker.methods()
		.then(function(list)
		{
			var reallist;

			if (!clients)
				reallist = list;
			else
			{
				reallist = {};
				clients.split(/ *, */).forEach(function(name)
				{
					reallist[name] = list[name];
				});
			}

			return rlutils.getAllMethods(reallist);
		});
}
