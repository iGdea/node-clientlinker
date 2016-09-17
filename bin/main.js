"use strict";

var path		= require('path');
var rlutils		= require('./lib/rlutils');
var printTable	= require('./lib/print_table').printTable;
var runRl		= require('./lib/run_rl');
var debug		= require('debug')('clientlinker:bin');
var Command		= require('commander').Command;
// 强制使用clientlinker作为name
var program		= new Command('clientlinker');

// rlutils.colors.enabled = false;

program
	.version(require('../package.json').version);


program
	.command('list <conf_file>')
	.alias('ls')
	.description('list methods of clients')
	.option('--filter-client <name>', 'only those clients')
	.action(function(conf_file, options)
	{
		printAndRunMethos(conf_file, options, false);
	});

program
	.command('exec <conf_file> <action>')
	.alias('ex')
	.description('exec [action] of clients')
	.option('--query, --clk-query <data>', 'run param [query]')
	.option('--body, --clk-body <data>', 'run param [body]')
	.option('--options, --clk-options <data>', 'run param [options]')
	.option('--filter-client <name>', 'only those clients')
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

program
	.command('run <conf_file>')
	.description('run [action] of clients with methods list')
	.option('--filter-client <name>', 'only those clients')
	.action(function(conf_file, options)
	{
		printAndRunMethos(conf_file, options, true);
	});

program
	.command('help <cmd>')
	.description('display help for [cmd]')
	.action(function(cmd)
	{
		var self = this;
		var command;
		self.parent.commands.some(function(item)
		{
			if (item.name() == cmd || item.alias() == cmd)
			{
				command = item;
				return true;
			}
		});

		// command.help();
		// remove help info
		command.outputHelp(function(info)
		{
			return info.replace(/ +-h, --help [^\n]+\n/, '')
				.replace(/Usage: */, 'Usage: '+self.parent.name()+' ');
		});

		process.exit();
	});

// 默认输出帮助信息
program
	.command('*', null, {noHelp: true})
	.action(function()
	{
		this.parent.help();
	});


if (process.argv.length < 3)
	process.argv.push('--help');

program.parse(process.argv);



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
