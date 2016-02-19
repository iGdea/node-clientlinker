var utils		= require('./utils');
var readline	= require('readline');
var debug		= require('debug')('client_linker:rl');
var rl;

exports.testStart = testStart;
function testStart(allMethods, linker)
{
	if (!rl)
	{
		rl = readline.createInterface(
		{
			input: process.stdin,
			output: process.stdout
		});
	}

	printStart();

	var ActionParams = {};
	new Promise(function(resolve, reject)
		{
			rl.question('Action :  ', function(str)
				{
					try {
						var action = utils.parseAction(str, allMethods);
						if (action)
						{
							ActionParams.action = action;
							console.log(' ==> Action is <%s> <==', action);
							resolve();
						}
						else
						{
							rl.close();
							process.exit();
						}
					}
					catch(err)
					{
						reject(err);
					}
				});
		})
		.then(function()
		{
			return rlparam(rl, 'Query', ActionParams);
		})
		.then(function()
		{
			return rlparam(rl, 'Body', ActionParams);
		})
		.then(function()
		{
			return rlparam(rl, 'RunOptions', ActionParams);
		})
		.then(function()
		{
			console.log('\n ========= run <%s> =========', ActionParams.action);
			debug('run action:%s, query:%o, body:%o, runOptions:%o', ActionParams.action, ActionParams.query, ActionParams.body, ActionParams.runOptions);

			linker.run(ActionParams.action, ActionParams.query, ActionParams.body,
				function(err, data)
				{
					console.log('\n ========= result <%s> =========\nerr :  %s\ndata :  %s',
							ActionParams.action,
							utils.printObject(err),
							utils.printObject(data)
						);

					console.log('\n\n\n');
					testStart(allMethods, linker);
				},
				ActionParams.RunOptions);
		})
		.catch(function(err)
		{
			console.log(err);
			console.log('\n\n\n');
			testStart(allMethods, linker);
		});
}




function rlparam(rl, key, ActionParams)
{
	return new Promise(function(resolve, reject)
		{
			rl.question(key+' :  ', function(str)
				{
					try {
						var data = ActionParams[key.toLowerCase()] = utils.parseParam(str);
						console.log(' ==> %s <==\n%s', key,
							utils.printObject(data));
						resolve();
					}
					catch(err)
					{
						console.log(err);
						rlparam(rl, key, ActionParams)
							.then(resolve, reject);
					}
				});
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

