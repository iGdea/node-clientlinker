'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const ini = require('ini');
const debug = require('debug')('clientlinker-flow-mysql');
const mysql = require('mysql');

exports.flow = mysqlFlow;
exports.methods = methods;
exports._test = {};

function mysqlFlow(runtime, callback) {
	const client = runtime.client;
	const options = client.options;
	// handlerConfig
	// [sql]          sql 模版，见mysql包
	// [keys]         sql的values对应runtime.body的转化顺序
	// [onlyFirst]    返回结果取第一条数据
	const handlerConfig =
		options.mysqlhandler && options.mysqlhandler[runtime.method];
	if (!handlerConfig) return callback.next();

	return initPool(client).then(function(pool) {
		if (!pool) return callback.next();

		return new Promise(function(resolve, reject) {
			pool.getConnection(function(err, connection) {
				if (err) return reject(err);

				const values = translateValues(
					runtime.body,
					handlerConfig.keys,
					handlerConfig.subKeys
				);

				connection.query(handlerConfig.sql, values, function(
					err,
					results
				) {
					if (err) reject(err);
					else
						resolve(
							handlerConfig.onlyFirst
								? results && results[0]
								: results
						);

					connection.release();
				});
			});
		});
	});
}

function methods(client) {
	return initPool(client).then(function(pool) {
		if (!pool) return;

		const options = client.options;
		if (options.mysqlhandler && typeof options.mysqlhandler == 'object') {
			return Object.keys(options.mysqlhandler);
		}
	});
}

function initPool(client) {
	if (client.cache.mysqlPool) return Promise.resolve(client.cache.mysqlPool);

	const options = client.options;
	let getConfigPromise;

	// 如果有配置文件，优先使用配置文件
	if (options.mysqlConfigFile && options.mysqlConfigKey) {
		getConfigPromise = fs
			.readFileAsync(options.mysqlConfigFile, { encoding: 'utf8' })
			.then(function(data) {
				const json = ini.parse(data);
				debug('config json:%o', json);
				const config = json && json[options.mysqlConfigKey];

				if (!config) return options.mysql;

				// 格式转化
				// 运维的格式是固定的，非常给力
				return _.extend({}, options.mysql, {
					port: config.DBPort,
					host: config.DBIP,
					user: config.DBUser,
					password: config.DBPass,
					database: config.DBName
				});
			})
			.catch(function(err) {
				debug('read config err:%o', err);

				return options.mysql;
			});
	} else {
		getConfigPromise = Promise.resolve(options.mysql);
	}

	return getConfigPromise.then(function(config) {
		debug('mysql config:%o', config);
		if (
			!config ||
			!config.host ||
			!config.user ||
			!config.password ||
			!config.database
		) {
			return;
		}

		return (
			client.cache.mysqlPool ||
			(client.cache.mysqlPool = mysql.createPool(config))
		);
	});
}

exports._test.translateValues = translateValues;
function translateValues(mainValues, mainKeys, subKeys) {
	const result = [];
	if (!mainValues || !mainKeys) return result;

	mainKeys.forEach(function(name) {
		const keys = subKeys && subKeys[name];
		let value = mainValues[name];
		if (keys) {
			const isValArray = Array.isArray(value);
			if (!isValArray) value = [value];

			const subVals = [];
			value.forEach(function(params) {
				if (!params) return;

				const tmpVal = [];
				subVals.push(tmpVal);
				keys.forEach(function(name) {
					tmpVal.push(params[name]);
				});
			});

			if (isValArray) result.push(subVals);
			else result.push(subVals[0] || []);
		} else {
			result.push(value);
		}
	});

	return result;
}
