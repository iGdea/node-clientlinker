var Promise		= require('bluebird');
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
			function question()
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
								console.log(' ==> No Action <%s> <==', action);
								question();
							}
						}
						catch(err)
						{
							reject(err);
						}
					});
			}

			question();
		})
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
			return utils.run(linker, ActionParams.action, ActionParams.query, ActionParams.body, ActionParams.runoptions);
		})
		.catch(function(err)
		{
			console.log('\n ========= Unexpected Error %s =========\n%s',
				utils.printObject(ActionParams.action),
				utils.printObject(err));
		})
		.then(function()
		{
			console.log('\n\n\n');
			testStart(allMethods, linker);
		});
}




function rlparam(linker, rl, key, ActionParams)
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
						rlparam(linker, rl, key, ActionParams)
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

