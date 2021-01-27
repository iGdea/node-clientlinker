const KEY = Date.now() + process.pid + Math.floor(Math.random() * 10000);
const hasOwnProperty = Object.prototype.hasOwnProperty;

class DateKey {
	constructor(key) {
		this.key = key;
	}

	get BUFFER() {
		return `${this.key}_buf`;
	}

	get ERROR() {
		return `${this.key}_err`;
	}

	get DATE() {
		return `${this.key}_date`;
	}
}

const KEYS =  new DateKey(KEY);

function stringify(data) {
	if (!data || typeof data != 'object') return data;

	return originalMap(data, function(item) {
		if (Buffer.isBuffer(item)) {
			return { type: KEYS.BUFFER, data: item.toString('base64') };
		} else if (item instanceof Error) {
			return {
				type: KEYS.ERROR,
				data: originalMap(item, exports.stringify, {
					message: item.message
				})
			};
		} else if (item instanceof Date) {
			return {
				type: KEYS.DATE,
				data: item.toJSON()
			};
		} else if (typeof item == 'object') {
			return exports.stringify(item);
		} else {
			return item;
		}
	});
}

function parse(data, KEY) {
	if (!data || typeof data != 'object' || !KEY) return data;
	const KEYS = new DateKey(KEY);

	return originalMap(data, function(item) {
		if (item && typeof item == 'object') {
			if (item.type) {
				if (item.type == KEYS.BUFFER) {
					return Buffer.from(item.data || '', 'base64');
				} else if (item.type == KEYS.ERROR) {
					return originalMap(
						item.data,
						exports.parse,
						new Error(item.data.message)
					);
				} else if (item.type == KEYS.DATE) {
					return new Date(item.data);
				}
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
exports.DateKey = DateKey;
