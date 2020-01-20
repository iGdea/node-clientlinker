'use strict';

let _		= require('lodash');
let Promise	= require('bluebird');
let fs		= Promise.promisifyAll(require('fs'));
let ini		= require('ini');
let debug	= require('debug')('clientlinker-flow-mysql');
let mysql	= require('mysql');

exports.flow = mysqlFlow;
exports.methods = methods;
exports._test = {};


function mysqlFlow(runtime, callback)
{
	let client = runtime.client;
	let options = client.options;
	// handlerConfig
	// [sql]          sql 模版，见mysql包
	// [keys]         sql的values对应runtime.body的转化顺序
	// [onlyFirst]    返回结果取第一条数据
	let handlerConfig = options.mysqlhandler && options.mysqlhandler[runtime.method];
	if (!handlerConfig) return callback.next();

	return initPool(client)
		.then(function(pool)
		{
			if (!pool) return callback.next();

			return new Promise(function(resolve, reject)
			{
				pool.getConnection(function(err, connection)
				{
					if (err) return reject(err);

					let values = translateValues(runtime.body, handlerConfig.keys, handlerConfig.subKeys);

					connection.query(handlerConfig.sql, values, function(err, results)
					{
						if (err)
							reject(err);
						else
							resolve(handlerConfig.onlyFirst ? results && results[0] : results);

						connection.release();
					});
				});
			});

		});
}

function methods(client)
{
	return initPool(client)
		.then(function(pool)
		{
			if (!pool) return;

			let options = client.options;
			if (options.mysqlhandler && typeof options.mysqlhandler == 'object')
			{
				return Object.keys(options.mysqlhandler);
			}
		});
}

function initPool(client)
{
	if (client.cache.mysqlPool) return Promise.resolve(client.cache.mysqlPool);

	let options = client.options;
	let getConfigPromise;

	// 如果有配置文件，优先使用配置文件
	if (options.mysqlConfigFile && options.mysqlConfigKey)
	{
		getConfigPromise = fs.readFileAsync(options.mysqlConfigFile, {encoding: 'utf8'})
			.then(function(data)
			{
				let json = ini.parse(data);
				debug('config json:%o', json);
				let config = json && json[options.mysqlConfigKey];

				if (!config) return options.mysql;

				// 格式转化
				// 运维的格式是固定的，非常给力
				return _.extend({}, options.mysql,
					{
						port		: config.DBPort,
						host		: config.DBIP,
						user		: config.DBUser,
						password	: config.DBPass,
						database	: config.DBName
					});
			})
			.catch(function(err)
			{
				debug('read config err:%o', err);

				return options.mysql;
			});
	}
	else
	{
		getConfigPromise = Promise.resolve(options.mysql);
	}


	return getConfigPromise.then(function(config)
	{
		debug('mysql config:%o', config);
		if (!config
			|| !config.host
			|| !config.user
			|| !config.password
			|| !config.database)
		{
			return;
		}

		return client.cache.mysqlPool
			|| (client.cache.mysqlPool = mysql.createPool(config));
	});
}


exports._test.translateValues = translateValues;
function translateValues(mainValues, mainKeys, subKeys)
{
	let result = [];
	if (!mainValues || !mainKeys) return result;

	mainKeys.forEach(function(name)
	{
		let keys = subKeys && subKeys[name];
		let value = mainValues[name];
		if (keys)
		{
			let isValArray = Array.isArray(value);
			if (!isValArray) value = [value];

			let subVals = [];
			value.forEach(function(params)
			{
				if (!params) return;

				let tmpVal = [];
				subVals.push(tmpVal);
				keys.forEach(function(name)
				{
					tmpVal.push(params[name]);
				});
			});

			if (isValArray)
				result.push(subVals);
			else
				result.push(subVals[0] || []);
		}
		else
		{
			result.push(value);
		}
	});

	return result;
}
