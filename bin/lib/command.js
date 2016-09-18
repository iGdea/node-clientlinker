"use strict";

var Command2	= require('commander').Command;
var pkg			= require('../../package.json');
// 强制使用clientlinker作为name
var program		= new Command2('clientlinker');


exports.Command = Command;
function Command()
{
	var program = this.program = new Command2(pkg.name);
	program.version('v'+pkg.version);
}

var proto = Command.prototype;

proto.list = function list()
{
	return this.program
		.command('list <conf_file>')
		.alias('ls')
		.description('list methods of clients')
		.option('--filter-client <name>', 'only those clients');
};

proto.exec = function exec()
{
	return this.program
		.command('exec <conf_file> <action>')
		.alias('ex')
		.description('exec [action] of clients')
		.option('--query, --clk-query <data>', 'run param [query]')
		.option('--body, --clk-body <data>', 'run param [body]')
		.option('--options, --clk-options <data>', 'run param [options]')
		.option('--filter-client <name>', 'only those clients');
};

proto.run = function run()
{
	return this.program
		.command('run <conf_file>')
		.description('run [action] of clients with methods list')
		.option('--filter-client <name>', 'only those clients');
};

proto.help = function help()
{
	return this.program
		.command('help <cmd>')
		.description('display help for [cmd]')
		.action(function(cmd)
		{
			var self = this;

			var command = findCommand(self.parent, cmd);
			if (!command) throw new Error('No Defined Command, '+cmd);

			// command.help();
			// remove help info
			command.outputHelp(function(info)
			{
				return info.replace(/ +-h, --help [^\n]+\n/, '')
					.replace(/Usage: */, 'Usage: '+self.parent.name()+' ');
			});
		});
};

proto.anycmd = function anycmd()
{
	return this.program
		.command('* [conf_file] [cmd]', null, {noHelp: true})
		.allowUnknownOption(true)
		.action(function(conf_file, cmd)
		{
			var command = cmd && cmd != 'help'
					&& findCommand(this.parent, cmd);

			// 默认输出帮助信息
			if (!command)
				this.parent.help();
			else
			{
				var avgs = this.parent.rawArgs.slice();
				avgs.splice(2, 2, cmd, conf_file);
				this.parent.parse(avgs);
			}
		});
};

function findCommand(program, cmd)
{
	var command;
	program.commands.some(function(item)
	{
		if (item.name() == cmd || item.alias() == cmd)
		{
			command = item;
			return true;
		}
	});

	return command;
}

