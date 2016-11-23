"use strict";

var _		= require('underscore');
var vm		= require('vm');
var debug	= require('debug')('clientlinker:rlutils');
var util	= require('util');
var path	= require('path');
var chalk	= require('chalk');
var fs		= require('fs');
var STATIC	= require('../../lib/static');
var rlutils	= exports;

var colors = exports.colors = new chalk.constructor();

exports.parseAction = parseAction;
function parseAction(str, allMethods)
{
	str = str && (''+str).trim();
	if (!str)
		return;
	else if (allMethods.indexOf(str) != -1)
		return str;
	else if (!isNaN(str))
		return allMethods[Number(str)-1];
	else
	{
		var clientName = STATIC.parseAction(str).clientName;
		if (allMethods.indexOf(clientName+'.*') != -1)
			return str;
	}
}


exports.parseParam = function parseParam()
{
	try {
		return _parseParam.apply(this, arguments);
	}
	catch(err)
	{
		err.__parseParamError__ = true;
		throw err;
	}
};


var dataTypeReg = /^ *([\w\-]+):/;
function _parseParam(linker, str)
{
	if (!str) return str;

	debug('run str start:%s', str);
	var type;
	var data = str.replace(dataTypeReg, function(all, type0)
		{
			type = type0;
			return '';
		});

	if (!type) type = 'object';

	var jsonk = linker.JSON;

	switch(type)
	{
		case 'object':
		case 'obj':
			return str2obj(linker, data);

		case 'jsonk':
			return jsonk.parseNoWrap(str2obj(linker, data));

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
				return _parseParam(linker, type.substr(5)+':'+content);
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
exports.USER_HOME = process.env.HOME || process.env.USERPROFILE;
function resolve(str)
{
	if (str.substr(0, 2) == '~/' && exports.USER_HOME)
		return path.resolve(exports.USER_HOME, str.substr(2));
	else
		return path.resolve(str);
}


exports.str2obj = str2obj;
function str2obj(linker, str)
{
	var data = vm.runInThisContext('__str2obj__=\n'+str+'', {lineOffset: 1});
	return data;
}


exports.printObject = printObject;
function printObject(obj)
{
	if (obj instanceof Error)
		return obj.stack;
	else
		return util.inspect(obj, {depth: 8, colors: colors.enabled});
}


exports.getAllMethods = getAllMethods;
function getAllMethods(list)
{
	var allMethods	= [];
	var lines		= [];
	var allFlows	= [];
	var clientNames	= Object.keys(list).sort();

	clientNames.forEach(function(clientName)
	{
		var item = list[clientName];
		lines.push(
		{
			type: 'header',
			client: clientName
		});

		var methods = item && item.methods && Object.keys(item.methods).sort();
		if (methods && methods.length)
		{
			methods.forEach(function(method)
			{
				var froms = item.methods[method]
						.map(function(from)
						{
							return from && from.name;
						});

				var action = clientName+'.'+method;
				allFlows.push.apply(allFlows, froms);

				lines.push(
					{
						type	: 'line',
						index	: allMethods.push(action),
						client	: clientName,
						method	: method,
						action	: action,
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
	allMethods.allFlows = _.uniq(allFlows)
		.sort()
		.map(function(name)
		{
			return name === undefined ? 'undefined' : name;
		});

	return allMethods;
}
