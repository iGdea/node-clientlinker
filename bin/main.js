"use strict";

var rlutils			= require('./lib/rlutils');
var runRl			= require('./lib/run_rl');
var Command			= require('./lib/command').Command;
var commandActions	= require('./lib/command_actions');
var stdout			= require('./lib/stdout');

var command = new Command;

command.run()
	.action(function(conf_file, command)
	{
		commandActions.listAction(conf_file, command.__clk_options__)
			.then(function(data)
			{
				runRl.start(data.linker, data.methods);
			},
			function(){});
	});

command.list()
	.action(function(conf_file, command)
	{
		commandActions.listAction(conf_file, command.__clk_options__)
			.catch(function(){})
			.then(exit);
	});

command.exec()
	.action(function(conf_file, action, command)
	{
		commandActions.execAction(conf_file, action, command.__clk_options__)
			.catch(function(){})
			.then(exit);
	});

command.anycmd();
command.help().action(function(){});

var argv = process.argv.slice();
if (argv.length < 3) argv.push('--help');

command.program.parse(argv);


function exit()
{
	stdout.promise.then(function()
		{
			process.exit();
		});
}
