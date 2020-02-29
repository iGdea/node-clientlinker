'use strict';

const KEY = Date.now() + process.pid + Math.floor(Math.random() * 10000);
const BUFFER_KEY = KEY + '_buf';
const ERROR_KEY = KEY + '_err';
const hasOwnProperty = Object.prototype.hasOwnProperty;

function stringify(data) {
	if (!data || typeof data != 'object') return data;

	return originalMap(data, function(item) {
		if (Buffer.isBuffer(item)) {
			return { type: BUFFER_KEY, data: item.toString('base64') };
		} else if (item instanceof Error) {
			return {
				type: ERROR_KEY,
				data: originalMap(item, exports.stringify, {
					message: item.message
				})
			};
		} else if (typeof item == 'object') return exports.stringify(item);
		else return item;
	});
}

function parse(data, KEY) {
	if (!data || typeof data != 'object' || !KEY) return data;

	const BUFFER_KEY = KEY + '_buf';
	const ERROR_KEY = KEY + '_err';

	return originalMap(data, function(item) {
		if (item && typeof item == 'object') {
			if (item.type) {
				if (item.type == BUFFER_KEY)
					return Buffer.from(item.data || '', 'base64');
				else if (item.type == ERROR_KEY)
					return originalMap(
						item.data,
						exports.parse,
						new Error(item.data.message)
					);
			}

			return exports.parse(item, KEY);
		} else {
			return item;
		}
	});
}

function originalMap(list, handler, tmpData) {
	if (Array.isArray(list)) {
		return list.map(handler);
	} else {
		if (!tmpData) tmpData = {};

		for (const i in list) {
			if (hasOwnProperty.call(list, i)) {
				tmpData[i] = handler(list[i], i);
			}
		}

		return tmpData;
	}
}

exports.parse = parse;
exports.stringify = stringify;

exports.CONST_KEY = KEY;
exports.CONST_VARS = {
	BUFFER_KEY: BUFFER_KEY,
	ERROR_KEY: ERROR_KEY
};
