var assert = require('assert');
var ClientLinker = require('../');
var runClientHandler = require('./runClientHandler');

describe('flows', function()
{
	it('localfile', function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['localfile'],
				localfileDir: __dirname+'/localfile'
			});

		var promise1 = linker.run('client.js')
			.then(function()
			{
				assert(false);
			},
			function(err)
			{
				assert.equal(err.message, 'local file errmsg')
			});

		var promise2 = linker.run('client.json')
			.then(function(data)
			{
				assert.equal(data.string, 'string');
			});

		Promise.all([promise1, promise2])
			.then(function(){done()}, done);
	});



	it('confighandler', function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['confighandler'],
				clients: {
					client: {
						confighandler: require('./pkghandler/client')
					}
				}
			});

		runClientHandler(linker, done);
	});


	it('pkghandler', function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['pkghandler'],
				pkghandlerDir: __dirname+'/pkghandler'
			});

		runClientHandler(linker, done);
	});

	it('logger', function(done)
	{
		var linker = ClientLinker(
			{
				flows: ['logger', 'custom'],
				logger: true,
				customFlows:
				{
					custom: function custom(args, callback)
					{
						callback(null, {reponse: 'reponse'});
					}
				},
				clients:
				{
					client: null
				}
			});

		linker.run('client.method', 123, {body:456})
			.then(function(){done()}, done);
	})
});
