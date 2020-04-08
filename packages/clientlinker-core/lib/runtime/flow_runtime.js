'use strict';

// const _ = require('lodash');
const Promise = require('bluebird');
const isPromise = require('is-promise');
const debug = require('debug')('clientlinker:flow_runtime');
// const deprecate = require('depd')('clientlinker:flow_runtime');
const utils = require('../utils');

class FlowRuntime {
	constructor(flow, onetry) {
		const self = this;
		self.flow = flow;
		self.onetry = onetry;
		self.runtime = onetry.runtime;

		let resolve, reject;
		const promise = new Promise(function(resolve0, reject0) {
			resolve = resolve0;
			reject = reject0;
		}).catch(function(err) {
			err = self._error(err);
			throw err;
		});

		self.promise = promise;
		self._resolve = resolve;
		self._reject = reject;
		self.nextRunner = null;
	}

	run() {

		try {
			debug('flow run:%s', this.flow.name);
			let ret = this.flow.run(this.runtime, this);
			if (!isPromise(ret)) ret = Promise.resolve(ret);

			ret.then(this._resolve, this._reject);
		} catch (err) {
			this._reject(err);
		}

		return this.promise;
	}

	next() {
		let nextRunner = this.nextRunner;
		if (!nextRunner) {
			nextRunner = this.nextRunner = this.onetry.nextRunner();
			if (nextRunner) {
				debug('nextRunner:%s', nextRunner.flow.name);
				nextRunner.run();
			} else {
				const runtime = this.runtime;
				debug('flow out: %s', runtime.action);
				return Promise.reject(
					utils.newNotFoundError('CLIENT FLOW OUT', runtime)
				);
			}
		} else debug('run next twice');

		return nextRunner.promise;
	}

	toJSON() {
		return {
			name: this.flow.name,
		};
	}

	_error(err) {
		const client = this.runtime.client;
		if (client.options.anyToError)
			err = client.linker.anyToError(err, this);

		// 方便定位问题
		if (
			err &&
			client.options.exportErrorInfo !== false &&
			!err.fromClient &&
			!err.CLIENTLINKER_TYPE &&
			typeof err == 'object'
		) {
			utils.expandError(err, this.runtime, this.flow.name);
		}

		return err;
	}

}

exports.FlowRuntime = FlowRuntime;
