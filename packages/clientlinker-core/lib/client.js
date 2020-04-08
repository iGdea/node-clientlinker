'use strict';

const Promise = require('bluebird');
const debug = require('debug')('clientlinker:client');

class Client {
	constructor(name, linker, options) {
		this.name = name;
		this.linker = linker;
		this.options = options || {};
		// flow 会放一些cache在这里
		this.cache = {};
	}

	run(runtime) {
		// var self = this;
		// var clientFlows = self.options.flows;
		// if (!clientFlows || !clientFlows.length)
		// {
		// 	var err = new Error('CLIENTLINKER:NotFound,'+self.name);
		// 	err.CLIENTLINKER_TYPE = 'CLIENT NO FLOWS';
		// 	err.CLIENTLINKER_CLIENT = self.name;
		// 	err.CLIENTLINKER_ACTION = runtime.action;
		//
		// 	debug('not found flows options: %s', runtime.action);
		// 	return Promise.reject(err);
		// }

		return runtime.run();
	}

	methods() {
		const self = this;
		const clientFlows = self.options.flows;
		if (!clientFlows) return Promise.resolve([]);

		const promises = clientFlows.map(function(flowName) {
			const flow = self.linker.flow(flowName);
			if (!flow) return;

			return Promise.resolve(flow.methods(self)).then(function(list) {
				if (!list) {
					debug('no method inifo: %s', flowName);
					return;
				}

				return {
					flow: flow,
					methods: list
				};
			});
		});

		return Promise.all(promises).then(function(methodList) {
			const map = {};
			methodList.forEach(function(item) {
				if (!item) return;
				item.methods.forEach(function(method) {
					const methodInfo = map[method] || (map[method] = []);
					methodInfo.push(item.flow);
				});
			});

			return map;
		});
	}
}

exports.Client = Client;
