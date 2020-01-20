'use strict';

let _ = require('lodash');

exports.DEFAULT_ERROR = 'CLIENT_LINKER_DEFERT_ERROR';

exports.anyToError = anyToError;
function anyToError(originalError, runner) {
	if (originalError instanceof Error) return originalError;

	let errType = typeof originalError;
	let err;

	if (originalError && errType == 'object') {
		err = new Error(originalError.message || 'ERROR');
		_.extend(err, originalError);
	} else if (errType == 'number') {
		err = new Error(
			'client,' + runner.runtime.action + ',' + originalError
		);
		err.code = err.errCode = originalError;
	} else {
		err = new Error(originalError || exports.DEFAULT_ERROR);
	}

	err.isClientLinkerNewError = true;
	err.originalError = originalError;
	return err;
}

exports.expandError = expandError;
function expandError(err, runtime, flowName) {
	if (runtime.client) {
		err.fromClient = runtime.client.name;
		err.fromClientMethod = runtime.method;
	} else {
		let actionInfo = parseAction(runtime.action);
		err.fromClient = actionInfo.clientName;
		err.fromClientMethod = actionInfo.method;
	}

	if (flowName) err.fromClientFlow = flowName;

	return err;
}

exports.newNotFoundError = newNotFoundError;
function newNotFoundError(type, runtime) {
	let err = new Error('CLIENTLINKER:NotFound,' + runtime.action);
	err.CLIENTLINKER_TYPE = type;
	expandError(err, runtime);
	return err;
}

exports.parseActionCache = {};
exports.parseAction = parseAction;
function parseAction(action) {
	let cache = exports.parseActionCache[action];
	if (!cache) {
		let arr = action.split('.');
		let clientName = arr.shift();

		cache = exports.parseActionCache[action] = {
			clientName: clientName,
			method: arr.join('.')
		};
	}

	return cache;
}
