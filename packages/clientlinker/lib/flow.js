const debug = require('debug')('clientlinker:flow');

class Flow {
	constructor(name) {
		this.name = name;
	}

	run(runtime, callback) {
		debug('skip by no handler: %s', this.name);
		return callback.next();
	}

	async methods() {
		debug('skip by no handler: %s', this.name);
		return [];
	}
}

exports.Flow = Flow;
