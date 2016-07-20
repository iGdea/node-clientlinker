var _		= require('underscore');
var utils	= require('./utils');
var debug	= require('debug')('client_linker:run_argv');



exports.runActionByArgv = runActionByArgv;
function runActionByArgv(linker, argvInfo, allMethods)
{
	var action = argvInfo['clk-action'] || argvInfo.action;
	action && (action = utils.parseAction(action, allMethods));
	if (!action) return false;

	var query		= utils.parseParam(argvInfo['clk-query'] || argvInfo.query);
	var body		= utils.parseParam(argvInfo['clk-body'] || argvInfo.body);
	var runOptions	= utils.parseParam(argvInfo['clk-options'] || argvInfo);

	console.log('\n ========= run <%s> =========', action);
	debug('run action:%s, query:%o, body:%o, runOptions:%o', action, query, body, runOptions);

	linker.run(action, query, body, function(err, data)
	{
		console.log('\n ========= result <%s> =========\nerr  :  %s\ndata :  %s',
			action,
			utils.printObject(err),
			utils.printObject(data)
		);
	},
	runOptions);

	return true;
}


exports.getAllMethods = getAllMethods;
function getAllMethods(list)
{
	var allMethods	= [];
	var lines		= [];
	var allFlowFrom	= [];
	var clientNames	= Object.keys(list).sort();

	clientNames.forEach(function(clientName)
	{
		var item = list[clientName];
		lines.push(
		{
			type: 'header',
			client: clientName
		});

		var methods = item.methods && Object.keys(item.methods).sort();
		if (methods && methods.length)
		{
			methods.forEach(function(methodName)
			{
				var froms = item.methods[methodName]
						.map(function(from)
						{
							return from && from.name;
						});

				var runKey = clientName+'.'+methodName;
				allFlowFrom.push.apply(allFlowFrom, froms);

				lines.push(
					{
						type	: 'line',
						index	: allMethods.push(runKey),
						method	: runKey,
						froms	: froms
					});
			});
		}
		else
		{
			lines.push({type: 'nomethods'});
		}
	});


	allMethods.lines = lines;
	allMethods.allFlowFrom = _.uniq(allFlowFrom)
		.sort()
		.map(function(name)
		{
			return name === undefined ? 'undefined' : name;
		});

	return allMethods;
}
