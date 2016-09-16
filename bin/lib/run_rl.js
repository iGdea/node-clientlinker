"use strict";

var Promise		= require('bluebird');
var chalk		= require('chalk');
var debug		= require('debug')('clientlinker:rl');
var rlutils		= require('./rlutils');
var rl;

exports.start = start;
function start(allMethods, linker)
{
	if (!rl) rl = require('./get_rl');

	printStart();
	var ActionParams = {};

	rlaction(allMethods, ActionParams)
		.then(function()
		{
			return rlparam(linker, rl, 'Query', ActionParams);
		})
		.then(function()
		{
			return rlparam(linker, rl, 'Body', ActionParams);
		})
		.then(function()
		{
			return rlparam(linker, rl, 'Options', ActionParams);
		})
		.then(function()
		{
			return rlutils.run(linker, ActionParams.action, ActionParams.query, ActionParams.body, ActionParams.options);
		})
		.catch(function(err)
		{
			console.log('\n ========= Unexpected Error %s =========\n%s',
				chalk.green(ActionParams.action),
				rlutils.printObject(err));
		})
		.then(function()
		{
			console.log('\n\n\n');
			start(allMethods, linker);
		});
}


function rlaction(allMethods, ActionParams)
{
	return rl.question('Action :  ')
		.then(function(str)
		{
			var action = rlutils.parseAction(str, allMethods);
			if (action)
			{
				ActionParams.action = action;
				console.log(' ==> Action is <%s> <==', chalk.green(action));
			}
			else
			{
				console.log(' ==> No Action <%s> <==', chalk.red(str));
				return rlaction(allMethods, ActionParams);
			}
		});
}

function rlparam(linker, rl, key, ActionParams)
{
	return rl.question(key+' :  ')
		.then(function(str)
		{
			var data = rlutils.parseParam(linker, str);
			ActionParams[key.toLowerCase()] = data;
			console.log(' ==> %s <==\n%s', key, rlutils.printObject(data));
		})
		.catch(function(err)
		{
			console.log(err);
			return rlparam(linker, rl, key, ActionParams);
		});
}


function printStart()
{
	console.log(
		[
			'', '', '',

			' ***********************',
			' *                     *',
			' *     Action Test     *',
			' *                     *',
			' ***********************'
		].join('\n'));
}
