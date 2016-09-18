"use strict";

var Promise		= require('bluebird');
var rlutils		= require('./rlutils');
var printTable	= require('./print_table').printTable;
var printTpl	= require('./print_tpl');
var stdout		= require('./stdout');
var commandActions = exports;


exports.execAction = function execAction(conf_file, action, options)
{
	var linker = require(rlutils.resolve(conf_file));

	return commandActions.filterAllMehtods(linker, options.filterClient)
		.then(function(allMethods)
		{
			return commandActions.exec(linker, action, allMethods, options);
		},
		function(err)
		{
			stdout.error(printTpl.errorInfo(err));
			throw err;
		});
}


exports.listAction = function listAction(conf_file, options)
{
	var linker = require(rlutils.resolve(conf_file));

	return commandActions.filterAllMehtods(linker, options.filterClient)
		.then(function(allMethods)
		{
			var output = printTable(allMethods.lines, allMethods.allFlowFrom);
			stdout.log(output);

			return {
				output: output,
				linker: linker,
				methods: allMethods
			};
		})
		.catch(function(err)
		{
			stdout.error(printTpl.errorInfo(err));
			throw err;
		});
}


exports.exec = exec;
function exec(linker, action, allMethods, options)
{
	var realaction = rlutils.parseAction(action, allMethods);
	if (!realaction)
	{
		var err = new Error('Not Found Action');
		err.action = action;
		throw err;
	}

	return commandActions.runAction(linker, realaction,
			rlutils.parseParam(linker, options.clkQuery),
			rlutils.parseParam(linker, options.clkBody),
			rlutils.parseParam(linker, options.clkOptions)
		);
}


exports.filterAllMehtods = filterAllMehtods;
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
		})
		.then(function(allMethods)
		{
			if (!allMethods || !allMethods.length)
				throw new Error('No Client Has Methods');
			else
				return allMethods;
		});
}



exports.runAction = runAction;
function runAction(linker, action, query, body, options)
{
	var str = printTpl.runActionStart(action, query, body, options);
	stdout.log(str);

	var retPromise = linker.runIn([action, query, body, null, options], 'cli');

	return retPromise
		.then(function(data)
		{
			var str = printTpl.runActionEnd(action, 'data', retPromise.runtime, data);
			stdout.log(str);

			return data;
		},
		function(err)
		{
			var str = printTpl.runActionEnd(action, 'error', retPromise.runtime, err);
			stdout.error(str);

			throw err;
		});
}
