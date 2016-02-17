var readline	= require('readline');
var path		= require('path');
var vm			= require('vm');
var json		= require('../lib/json');
var debug		= require('debug')('client_linker:rl');
var util		= require('util');
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
						var action = parseAction(str, allMethods);
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
							printObject(err),
							printObject(data)
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


exports.parseAction = parseAction;
function parseAction(str, allMethods)
{
	str = str && str.trim();
	if (!str)
		return;
	else if (allMethods.indexOf(str) != -1)
		return str;
	else if (!isNaN(str))
		return allMethods[Number(str)-1];
	else
	{
		console.log('inval action :  %s', action);
		throw new Error('inval action');
	}
}


exports.parseParam = parseParam;
function parseParam(str)
{
	str = str && str.trim();
	if (!str) return;

	var data;
	try {
		data = vm.runInThisContext(str);
	}
	catch(err)
	{
		debug('run str err:%o', err);

		var parseDataSuc = false;
		if (str[0] == '{' && str[str.length-1] == '}')
		{
			try
			{
				data = vm.runInThisContext('('+str+')');
				parseDataSuc = true;
			}
			catch(err2)
			{
				debug('run (str) err:%o', err2);
			}
		}


		// 判断参数是不是文件
		if (!parseDataSuc && !/['"\{\}\n\r\t]/.test(str))
		{
			if (/^(((~|\.|\.\.)\/\\)|\/)/.test(str))
			{
				var file;
				if (str[0] == '~')
				{
					if (process.env.HOME)
						file = path.resolve(process.env.HOME, str.substr(2));
				}
				else
					file = str;

				if (file)
				{
					data = require(path.resolve(file));
					parseDataSuc = true;
				}
			}
			else if (process.platform === 'win32' && /^\w:[\/\\]/.test(str))
			{
				data = require(file);
				parseDataSuc = true;
			}
		}

		if (!parseDataSuc) throw err;
	}

	if (data && data.CONST_VARS) data = json.parse(data, data.CONST_VARS);
	return data;
}


exports.printObject = printObject;
function printObject(obj)
{
	if (obj instanceof Error)
		return obj.stack;
	else
		return util.inspect(obj, {depth: 8, colors: true});
}


function rlparam(rl, key, ActionParams)
{
	return new Promise(function(resolve, reject)
		{
			rl.question(key+' :  ', function(str)
				{
					try {
						var data = ActionParams[key.toLowerCase()] = parseParam(str);
						console.log(' ==> %s <==\n%s', key, printObject(data));
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

