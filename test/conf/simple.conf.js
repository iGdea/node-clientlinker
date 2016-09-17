"use strict";

var ClientLinker = require('../../');

module.exports = ClientLinker(
	{
		flows: ['confighandler'],
		clients:
		{
			client:
			{
				confighandler:
				{
					success: function(){return Promise.resolve()},
					error: function(){return Promise.reject()}
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
			}
		}
	});
