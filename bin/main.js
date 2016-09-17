"use strict";

var rlutils			= require('./lib/rlutils');
var runRl			= require('./lib/run_rl');
var Command			= require('./lib/command').Command;
var commandActions	= require('./lib/command_actions');

var command = new Command;

command.help().action(function(){process.exit()});

command.list()
	.action(function()
	{
		commandActions.listAction.apply(null, arguments)
			.catch(function(){});
	});

command.exec()
	.action(function()
	{
		commandActions.execAction.apply(null, arguments)
			.catch(function(){});
	});

command.run()
	.action(function()
	{
		commandActions.listAction.apply(null, arguments)
			.then(function(data)
			{
				runRl.start(data.linker, data.methods);
			},
			function(){});
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
