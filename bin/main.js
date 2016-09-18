"use strict";

var rlutils			= require('./lib/rlutils');
var runRl			= require('./lib/run_rl');
var Command			= require('./lib/command').Command;
var commandActions	= require('./lib/command_actions');

var command = new Command;

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

command.anycmd();
command.help().action(function(){process.exit()});

var argv = process.argv.slice();
if (argv.length < 3) argv.push('--help');

command.program.parse(argv);
