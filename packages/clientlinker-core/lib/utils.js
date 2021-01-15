'use strict';

exports.newNotFoundError = newNotFoundError;
function newNotFoundError(type, runtime) {
	const err = new Error('CLIENTLINKER:NotFound,' + runtime.action);
	err.CLIENTLINKER_TYPE = type;
	return err;
}

exports.parseActionCache = {};
exports.parseAction = parseAction;
function parseAction(action) {
	let cache = exports.parseActionCache[action];
	if (!cache) {
		const arr = action.split(/\.|:/);
		const clientName = arr.shift();

		cache = exports.parseActionCache[action] = {
			clientName: clientName,
			method: arr.join('.')
		};
	}

	return cache;
}
