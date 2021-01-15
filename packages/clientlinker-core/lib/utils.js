'use strict';

exports.DEFAULT_ERROR = 'CLIENT_LINKER_DEFERT_ERROR';

exports.newNotFoundError = newNotFoundError;
function newNotFoundError(type, runtime) {
	let err = new Error('CLIENTLINKER:NotFound,' + runtime.action);
	err.CLIENTLINKER_TYPE = type;
	return err;
}

exports.parseActionCache = {};
exports.parseAction = parseAction;
function parseAction(action) {
	let cache = exports.parseActionCache[action];
	if (!cache) {
		let arr = action.split(/\.|:/);
		let clientName = arr.shift();

		cache = exports.parseActionCache[action] = {
			clientName: clientName,
			method: arr.join('.')
		};
	}

	return cache;
}
