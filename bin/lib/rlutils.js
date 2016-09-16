"use strict";

var debug	= require('debug')('clientlinker:bin_utils');
var util	= require('util');
var vm		= require('vm');
var path	= require('path');
var chalk	= require('chalk');
var fs		= require('fs');


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
}


exports.parseParam = parseParam;
var dataTypeReg = /^ *([\w\-]+):/;
function parseParam(linker, str)
{
	if (!str) return str;

	debug('run str start:%s', str);
	var type;
	var data = str.replace(dataTypeReg, function(all, type0)
		{
			type = type0;
			return '';
		});

	if (!type) type = 'jsonk';

	var jsonk = linker.JSON;

	switch(type)
	{
		case 'jsonk':
			return jsonk.parseNoWrap(str2obj(data));

		case 'jsonk-':
		case 'jsonk_':
			return jsonk.parseFromString(data);

		case 'json':
			return JSON.parse(data);

		case 'buffer':
		case 'buf':
			return jsonk.parseType('Buffer', data);

		// file 默认为jsonk parse
		case 'file':
		case 'file-buf':
		case 'file-buffer':
			var file = resolve(data);
			var content = fs.readFileSync(file);
			return type == 'file' ? jsonk.parseFromString(content.toString()) : content;

		case 'require':
		case 'file-json':
		case 'file-js':
			var file = resolve(data);
			return require(file);

		default:
			if (type.substr(0, 5) == 'file-')
			{
				var file = resolve(data);
				var content = fs.readFileSync(file).toString();
				return parseParam(linker, type.substr(5)+':'+content);
			}
			else if (type.substr(0, 6) == 'jsonk-')
			{
				return jsonk.parseType(type.substr(6), data);
			}
			else
			{
				var parserName;
				var tmpParserName = type[0].toUpperCase() + type.substr(1);

				switch(tmpParserName)
				{
					case 'String':
						return ''+data;
					case 'Number':
						return +data;
					case 'Boolean':
						return data == '0' ? false : !!data;

					default:
						if (jsonk.parsermap[type])
							parserName = type;
						else if (jsonk.parsermap[tmpParserName])
							parserName = tmpParserName;

						if (parserName)
							return jsonk.parseType(parserName, data);
						else
							return str;
				}
			}
	}
}


// exports.maybeFilePath = maybeFilePath;
// function maybeFilePath(str)
// {
// 	var file;
// 	if (!/['"\{\}\n\r\t]/.test(str))
// 	{
// 		if (/^(((~|\.|\.\.)[\/\\])|\/)/.test(str))
// 			file = resolve(str);
// 		else if (process.platform === 'win32' && /^\w:[\/\\]/.test(str))
// 			file = str;
// 	}
//
// 	return file;
// }


exports.resolve = resolve;
function resolve(str)
{
	if (str.substr(0, 2) == '~/' && process.env.HOME)
		return path.resolve(process.env.HOME, str.substr(2));
	else
		return path.resolve(str);
}


// exports.isPKGFile = isPKGFile;
// function isPKGFile(file)
// {
// 	try {
// 		require(file);
// 		return require.resolve(file);
// 	}
// 	catch(err)
// 	{
// 		debug('require file err: %o', err);
// 	}
// }


exports.str2obj = str2obj;
function str2obj(str)
{
	return vm.runInNewContext('('+str+')', {});
}


exports.printObject = printObject;
function printObject(obj)
{
	if (obj instanceof Error)
		return obj.stack;
	else
		return util.inspect(obj, {depth: 8, colors: true});
}


exports.run = run;
function run(linker, action, query, body, options)
{
	console.log('\n ========= Action Run %s =========\n'
		+' >>> Query <<<\n%s\n\n'
		+' >>> Body <<<\n%s\n\n'
		+' >>> Options <<<\n%s',
		chalk.green(action),
		printObject(query),
		printObject(body),
		printObject(options));

	var retPromise = linker.runIn([action, query, body, null, options], 'cli');

	return retPromise
		.then(function(data)
		{
			console.log('\n ========= Action Result Success %s =========\n%s\n\n%s',
				chalk.green(action),
				printRuntime(retPromise.runtime),
				printObject(data));
		},
		function(err)
		{
			console.log('\n ========= Action Result Error %s =========\n%s\n\n%s',
				chalk.green(action),
				printRuntime(retPromise.runtime),
				printObject(err));
		});
}


function printRuntime(runtime)
{
	var retryTimes = runtime.retry.length;
	var alltime = runtime.timing.flowsEnd - runtime.navigationStart;
	var lastRetry = runtime.retry[runtime.retry.length-1];
	var flowStr = [];
	for (var runnedFlows = lastRetry.runnedFlows, len = runnedFlows.length; len--;)
	{
		var flowItem = runnedFlows[len];
		if (!flowItem || !flowItem.flow) continue;

		if (!flowStr.length)
		{
			flowStr.push(chalk.green(flowItem.flow.name)
				+ ' '
				+ chalk.blue(flowItem.timing.end - flowItem.timing.start)
				+ 'ms');
		}
		else
		{
			flowStr.push(chalk.gray(flowItem.flow.name));
		}
	}

	var lines = [];
	lines.push([
		chalk.cyan.underline('[Runtime]'),
		'use:',
			alltime > 250 ? chalk.red(alltime) : chalk.green(alltime),
			'ms,',
		'retry:',
			retryTimes != 1 ? chalk.red(retryTimes) : chalk.green(retryTimes)
	].join(' '));

	lines.push(chalk.cyan.underline('[FlowRun]') + ' ' +flowStr.join(' > '));

	return lines.join('\n');
}
