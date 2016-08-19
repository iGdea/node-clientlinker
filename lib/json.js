"use strict";

var _          = require('underscore');
var KEY        = Date.now() + process.pid + Math.floor(Math.random()*10000);
var BUFFER_KEY = 'buf_'+KEY;
var ERROR_KEY  = 'err_'+KEY;

function stringify(data)
{
	if (!data || typeof data != 'object') return data;

	var isarr = Array.isArray(data);
	var tmpData = isarr ? [] : {};

	each(data, isarr, function(item, key)
	{
		if (Buffer.isBuffer(item))
		{
			var bufValues = item.toJSON();
			// 兼容node版本
			bufValues.data && (bufValues = bufValues.data);

			tmpData[key] = {type: BUFFER_KEY, data: bufValues};
		}
		else if (item instanceof Error)
		{
			if (item.isClientLinkerNewError)
			{
				tmpData[key] = exports.stringify(item.originalError);
			}
			else
			{
				// 注意：这里会导致error继承关系丢失，即instanceof丢失
				var errInfo = _.extend({}, item, {stack: item.stack, message: item.message});
				delete errInfo.originalStack;
				tmpData[key] = {type: ERROR_KEY, data: errInfo};
			}
		}
		else if (typeof item == 'object')
			tmpData[key] = exports.stringify(item);
		else
			tmpData[key] = item;
	});

	return tmpData;
}


function parse(data, TYPES)
{
	if (!data || typeof data != 'object' || !TYPES) return data;

	var isarr = Array.isArray(data);
	var tmpData = isarr ? [] : {};

	each(data, isarr, function(item, key)
	{
		if (item && typeof item == 'object')
		{
			if (item.type)
			{
				if (item.type == TYPES.BUFFER_KEY)
					tmpData[key] = new Buffer(item.data || '');
				else if (item.type == TYPES.ERROR_KEY)
				{
					var err = new Error;
					var originalStack = err.stack;
					tmpData[key] = _.extend(err, item.data);
					err.originalStack = originalStack;
				}
			}

			if (!tmpData[key])
			{
				tmpData[key] = exports.parse(item, TYPES);
			}
		}
		else
		{
			tmpData[key] = item;
		}
	});

	return tmpData;
}


function each(list, isarr, handler)
{
	if (isarr)
	{
		list.forEach(handler);
	}
	else
	{
		for(var i in list)
		{
			if (list.hasOwnProperty(i))
			{
				handler(list[i], i);
			}
		}
	}
}


exports.parse = parse;
exports.stringify = stringify;

exports.CONST_VARS =
{
	BUFFER_KEY	: BUFFER_KEY,
	ERROR_KEY	: ERROR_KEY
};
