'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const isPromise = require('is-promise');
const debug = require('debug')('clientlinker:flow_runtime');
const deprecate = require('depd')('clientlinker:flow_runtime');
const Timing = require('./timing/flow_runtime_timing').Timing;
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
		}).then(
			function(data) {
				self._timeEnd();
				return data;
			},
			function(err) {
				self._timeEnd();
				err = self._error(err);
				throw err;
			}
		);

		self.promise = promise;
		self.resolve = resolve;
		self.reject = reject;
		self.nextRunner = null;
		self.startTime = null;
		self.endTime = null;

		self.timing = new Timing(self);
	}

	run() {
		this.startTime = Date.now();

		try {
			debug('flow run:%s', this.flow.name);
			const ret = this.flow.run(this.runtime, this);
			if (isPromise(ret)) ret.then(this.resolve, this.reject);
		} catch (err) {
			this.reject(err);
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

	nextAndResolve() {
		this.next().then(this.resolve, this.reject);
	}

	callback(ret, data) {
		ret ? this.reject(ret) : this.resolve(data);
	}

	toJSON() {
		return {
			name: this.flow.name,
			startTime: this.startTime,
			endTime: this.endTime
		};
	}

	_timeEnd() {
		this.endTime = Date.now();
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


FlowRuntime.prototype.toFuncCallback = deprecate.function(function() {
	const self = this;
	const callback = _.bind(self.callback, self);

	['resolve', 'reject', 'promise'].forEach(function(name) {
		callback[name] = self[name];
	});

	['next', 'nextAndResolve'].forEach(function(name) {
		callback[name] = _.bind(self[name], self);
	});

	callback.callback = callback;

	return callback;
}, 'Callback Param has be an Object');
