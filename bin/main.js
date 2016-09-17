"use strict";

var rlutils			= require('./lib/rlutils');
var runRl			= require('./lib/run_rl');
var Command			= require('./lib/command').Command;
var commandActions	= require('./lib/command_actions');

var command = new Command;

command.exec().action(commandActions.execAction);
command.list().action(commandActions.listAction);
command.help().action(function(){process.exit()});

command.run()
	.action(function(conf_file, options)
	{
		commandActions.listAction(conf_file, options)
			.then(function(data)
			{
				runRl.start(data.linker, data.methods);
			});
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
