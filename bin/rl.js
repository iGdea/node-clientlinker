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
			console.log('\n ========= Action Run <%s> =========', ActionParams.action);
			debug('run action:%s, query:%o, body:%o, runOptions:%o', ActionParams.action, ActionParams.query, ActionParams.body, ActionParams.runOptions);

			return linker.run(ActionParams.action, ActionParams.query, ActionParams.body, ActionParams.RunOptions)
				.then(function(data)
				{
					console.log('\n ========= Action Result Success <%s> =========\n%s', ActionParams.action, utils.printObject(data));
				},
				function(err)
				{
					console.log('\n ========= Action Result Error <%s> =========\n%s', ActionParams.action, utils.printObject(err));
				});
		})
		.catch(function(err)
		{
			console.log('\n ========= Unexpected Error <%s> =========\n%s', ActionParams.action, utils.printObject(err));
		})
		.then(function()
		{
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

