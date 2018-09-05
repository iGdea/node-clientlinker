'use strict';

var _			= require('lodash');
var Promise		= require('bluebird');
var isPromise	= require('is-promise');
var debug		= require('debug')('clientlinker:flow_runtime');
var deprecate	= require('depd')('clientlinker:flow_runtime');

exports.FlowRuntime = FlowRuntime;

function FlowRuntime(flow, thisTry)
{
	var self		= this;
	self.flow		= flow;
	self.thisTry	= thisTry;
	self.runtime	= thisTry.runtime;

	var resolve, reject;
	var promise = new Promise(function(resolve0, reject0)
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
}


_.extend(FlowRuntime.prototype,
{
	run: function()
	{
		this.startTime = Date.now();

		try {
			var ret = this.flow.run(this.runtime, this);
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
		if (!this.nextRunner)
		{
			this.nextRunner = this.thisTry.next();
			this.nextRunner.run();
		}
		else
			debug('run next twice');

		return this.nextRunner.promise;
	},
	nextAndResolve: function()
	{
		this.next().then(this.resolve, this.reject);
	},
	callback: function(ret, data)
	{
		ret ? this.reject(ret) : this.resolve(data);
	},

	_timeEnd: function()
	{
		this.endTime = Date.now();
	},
	_error: function(err)
	{
		var client = this.runtime.client;
		if (client.options.anyToError)
			err = client.linker.anyToError(err, this);

		// 方便定位问题
		if (err && client.options.exportErrorInfo !== false
			&& !err.fromClient
			// 例如 CLIENT FLOW OUT 错误
			&& !err.CLIENTLINKER_TYPE
			&& !this.nextRunner
			&& typeof err == 'object')
		{
			err.fromClient = client.name;
			err.fromClientMethod = this.runtime.method;
			err.fromClientFlow = this.flow.name;
		}

		return err;
	},
	toFuncCallback: function()
	{
		var self = this;
		var callback = _.bind(self.callback, self);

		['reject', 'reject', 'promise'].forEach(function(name)
		{
			callback[name] = self[name];
		});

		['next', 'nextAndResolve'].forEach(function(name)
		{
			callback[name] = _.bind(self[name], self);
		});

		return callback;
	}
});


FlowRuntime.prototype.toFuncCallback = deprecate.function(FlowRuntime.prototype.toFuncCallback, 'Callback Param has be an Object');
