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

	self.timing = new Timing(self);
}

var proto = FlowRuntime.prototype;
_.extend(proto,
{
	run: function()
	{
		this.startTime = Date.now();

		try {
			debug('flow run:%s', this.flow.name);
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
		var nextRunner = this.nextRunner;
		if (!nextRunner)
		{
			nextRunner = this.nextRunner = this.thisTry.nextRunner();
			debug('nextRunner:%s', nextRunner.flow.name);
			nextRunner.run();
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
	toFuncCallback: deprecate.function(function()
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
	},
	'Callback Param has be an Object'),
});


function Timing(runner)
{
	this.runner = runner;
}

Object.defineProperties(Timing.prototype,
{
	start:
	{
		configurable: true,
		get: function()
		{
			return this.runner.startTime;
		}
	},
	end:
	{
		configurable: true,
		get: function()
		{
			return this.runner.endTime;
		}
	},
	navigationStart:
	{
		configurable: true,
		get: function()
		{
			return this.runner.runtime.navigationStart;
		}
	}
});

deprecate.property(Timing.prototype, 'navigationStart',
	'use `runtime.navigationStart` instead of `runner.timing.navigationStart`');
deprecate.property(Timing.prototype, 'start',
	'use `runner.startTime` instead of `runner.timing.start`');
deprecate.property(Timing.prototype, 'end',
	'use `runner.endTime` instead of `runner.timing.end`');
