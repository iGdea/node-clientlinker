var _		= require('underscore');
var rl		= require('./rl');
var debug	= require('debug')('client_linker:run_argv');


exports.runActionByArgv = runActionByArgv;
function runActionByArgv(linker, allMethods)
{
	var action = process.argv[3];
	action && (action = rl.parseAction(action, allMethods));
	if (!action) return false;

	var query		= rl.parseParam(process.argv[4]);
	var body		= rl.parseParam(process.argv[5]);
	var runOptions	= rl.parseParam(process.argv[6]);

	console.log('\n ========= run <%s> =========', action);
	debug('run action:%s, query:%o, body:%o, runOptions:%o', action, query, body, runOptions);

	linker.run(action, query, body, function(err, data)
	{
		console.log('\n ========= result <%s> =========\nerr :  %s\ndata :  %s',
			action,
			rl.printObject(err),
			rl.printObject(data)
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
	var clientNames	= Object.keys(list).sort(sortHandler);

	clientNames.forEach(function(clientName)
	{
		var item = list[clientName];
		lines.push(
		{
			type: 'header',
			client: clientName
		});

		var methods = item.methods && Object.keys(item.methods).sort(sortHandler);
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
		.sort(sortHandler)
		.map(function(name)
		{
			return name === undefined ? 'undefined' : name;
		});

	return allMethods;
}

function sortHandler(a,b){return a>b}
