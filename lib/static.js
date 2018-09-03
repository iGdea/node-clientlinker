'use strict';

var _ = require('lodash');

exports.DEFAULT_ERROR = 'CLIENT_LINKER_DEFERT_ERROR';

exports.anyToError = function anyToError(originalError, runtime)
{
	if (originalError instanceof Error) return originalError;

	var errType = typeof originalError;
	var err;

	if (originalError && errType == 'object')
	{
		err = new Error(originalError.message || 'ERROR');
		_.extend(err, originalError);
	}
	else if (errType == 'number')
	{
		err = new Error('client,'+runtime.action+','+originalError);
		err.code = err.errCode = originalError;
	}
	else
	{
		err = new Error(originalError || exports.DEFAULT_ERROR);
	}

	err.isClientLinkerNewError = true;
	err.originalError = originalError;
	return err;
};

exports.parseActionCache = {};
exports.parseAction = function parseAction(action)
{
	var cache = exports.parseActionCache[action];
	if (!cache)
	{
		var arr			= action.split('.');
		var clientName	= arr.shift();

		cache = exports.parseActionCache[action] =
		{
			clientName	: clientName,
			method		: arr.join('.')
		};
	}

	return cache;
};
