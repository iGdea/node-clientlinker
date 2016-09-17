"use strict";

var Promise			= require('bluebird');
var ClientLinker	= require('../../');

module.exports = ClientLinker(
	{
		flows: ['not_exists_flow', 'flowNext', 'confighandler'],
		clients:
		{
			client:
			{
				confighandler:
				{
					success: function(){return Promise.resolve()},
					error: function(){return Promise.reject()},
					error2: function(){return Promise.reject('errmsg')}
				}
			},
			client2:
			{
				confighandler:
				{
					method: function(query, body, callback, options)
					{
						return Promise.resolve(
							{
								query: query,
								body: body,
								options: options
							});
					}
				}
			},
			client3: null
		},
		customFlows:
		{
			flowNext: function(runtime, callback)
			{
				callback.next();
			}
		}
	});
