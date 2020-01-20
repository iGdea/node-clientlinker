'use strict';

let _			= require('lodash');
let Promise		= require('bluebird');
let isPromise	= require('is-promise');
let debug		= require('debug')('clientlinker:flow_runtime');
let deprecate	= require('depd')('clientlinker:flow_runtime');
let Timing		= require('./timing/flow_runtime_timing').Timing;
let utils		= require('../utils');

exports.FlowRuntime = FlowRuntime;

function FlowRuntime(flow, onetry)
{
	let self		= this;
	self.flow		= flow;
	self.onetry		= onetry;
	self.runtime	= onetry.runtime;

	let resolve, reject;
	let promise = new Promise(function(resolve0, reject0)
		{
			resolve = resolve0;
			reject = reject0;
		})
		.then(function(data)
		{
			self._timeEnd();
			return data;
		},
		function(err)
		{
			self._timeEnd();
			err = self._error(err);
			throw err;
		});

	self.promise	= promise;
	self.resolve	= resolve;
	self.reject		= reject;
	self.nextRunner	= null;
	self.startTime	= null;
	self.endTime	= null;

	self.timing = new Timing(self);
}

let proto = FlowRuntime.prototype;
_.extend(proto,
{
	run: function()
	{
		this.startTime = Date.now();

		try {
			debug('flow run:%s', this.flow.name);
			let ret = this.flow.run(this.runtime, this);
			if (isPromise(ret)) ret.then(this.resolve, this.reject);
		}
		catch(err)
		{
			this.reject(err);
		}

		return this.promise;
	},
	next: function()
	{
		let nextRunner = this.nextRunner;
		if (!nextRunner)
		{
			nextRunner = this.nextRunner = this.onetry.nextRunner();
			if (nextRunner)
			{
				debug('nextRunner:%s', nextRunner.flow.name);
				nextRunner.run();
			}
			else
			{
				let runtime = this.runtime;
				debug('flow out: %s', runtime.action);
				return Promise.reject(utils.newNotFoundError('CLIENT FLOW OUT', runtime));
			}
		}
		else
			debug('run next twice');

		return nextRunner.promise;
	},
	nextAndResolve: function()
	{
		this.next().then(this.resolve, this.reject);
	},
	callback: function(ret, data)
	{
		ret ? this.reject(ret) : this.resolve(data);
	},

	toJSON: function()
	{
		return {
			name		: this.flow.name,
			startTime	: this.startTime,
			endTime		: this.endTime,
		};
	},

	_timeEnd: function()
	{
		this.endTime = Date.now();
	},
	_error: function(err)
	{
		let client = this.runtime.client;
		if (client.options.anyToError)
			err = client.linker.anyToError(err, this);

		// 方便定位问题
		if (err && client.options.exportErrorInfo !== false
			&& !err.fromClient
			&& !err.CLIENTLINKER_TYPE
			&& typeof err == 'object')
		{
			utils.expandError(err, this.runtime, this.flow.name);
		}

		return err;
	},
	toFuncCallback: deprecate.function(function()
	{
		let self = this;
		let callback = _.bind(self.callback, self);

		['resolve', 'reject', 'promise'].forEach(function(name)
		{
			callback[name] = self[name];
		});

		['next', 'nextAndResolve'].forEach(function(name)
		{
			callback[name] = _.bind(self[name], self);
		});

		callback.callback = callback;

		return callback;
	},
	'Callback Param has be an Object'),
});
