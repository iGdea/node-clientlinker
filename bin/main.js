"use strict";

var path		= require('path');
var utils		= require('./lib/utils');
var printTable	= require('./lib/print_table').printTable;
var runRl		= require('./lib/run_rl');
var runArgv		= require('./lib/run_argv');
var debug		= require('debug')('clientlinker:bin');
var Command		= require('commander').Command;
// 强制使用clientlinker作为name
var program		= new Command('clientlinker');

program
	.version(require('../package.json').version);


program
	.command('list <conf_file>')
	.description('list methods of clients')
	// .option('--client <name>', 'only those clients')
	.action(function(conf_file, options)
	{
		printAndRunMethos(conf_file, options, false);
	});

program
	.command('exec <conf_file> <action>')
	.description('exec [action] of clients')
	.option('--query, --clk-query <data>', 'run param [query]')
	.option('--body, --clk-body <data>', 'run param [body]')
	.option('--options, --clk-options <data>', 'run param [options]')
	// .option('--query-file <path>', 'run param [query]')
	// .option('--body-file <path>', 'run param [body]')
	// .option('--options-file <path>', 'run param [options]')
	// .option('--query-str <string>', 'run param [query]')
	// .option('--body-str <string>', 'run param [body]')
	// .option('--options-str <string>', 'run param [options]')
	.action(function(conf_file, action, options)
	{
		var linker = require(utils.resolve(conf_file));

		linker.methods()
			.then(function(list)
			{
				var allMethods = runArgv.getAllMethods(list);
				if (allMethods.length)
				{
					runArgv.runActionByArgv(linker, action,
						{
							query: options.clkQuery,
							body: options.clkBody,
							options: options.clkOptions
						},
						allMethods);
				}
				else
					console.error('  ** No Client has Methods **   ');
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
	// .option('--client <name>', 'only those clients')
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



/****** Utils *******/
function printAndRunMethos(conf_file, options, isRunRl)
{
	var linker = require(utils.resolve(conf_file));
	linker.methods()
		.then(function(list)
		{
			var allMethods = runArgv.getAllMethods(list);
			if (allMethods.length)
			{
				printTable(allMethods.lines, allMethods.allFlowFrom);
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
