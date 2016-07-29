var _		= require('underscore');
var utils	= require('./utils');
var debug	= require('debug')('client_linker:run_argv');



exports.runActionByArgv = runActionByArgv;
function runActionByArgv(linker, argvInfo, allMethods)
{
	var action = argvInfo['clk-action'] || argvInfo.action;
	action && (action = utils.parseAction(action, allMethods));
	if (!action) return false;

	utils.run(linker, action,
		utils.parseParam(linker, argvInfo['clk-query'] || argvInfo.query),
		utils.parseParam(linker, argvInfo['clk-body'] || argvInfo.body),
		utils.parseParam(linker, argvInfo['clk-options'] || argvInfo.options));

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
			methods.forEach(function(method)
			{
				var froms = item.methods[method]
						.map(function(from)
						{
							return from && from.name;
						});

				var runKey = clientName+'.'+method;
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
