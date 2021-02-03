const _ = require('lodash');
const rlutils = require('./rlutils');
const printTable = require('./print_table').printTable;
const printTpl = require('./print_tpl');
const stdout = require('./stdout');
const pkg = require('../../package.json');

const commandActions = exports;

exports.execAction = function execAction(
	conf_file,
	action,
	options,
	ignoreRunError
) {
	options || (options = {});
	const linker = requireLinker(conf_file);

	return commandActions
		.filterAllMehtods(linker, options.clients)
		.then(function(allMethods) {
			const realaction = rlutils.parseAction(action, allMethods);
			if (!realaction) {
				const err = new Error('Not Found Action');
				err.action = action;
				throw err;
			}

			return commandActions.runAction(
				linker,
				realaction,
				options.query,
				options.body,
				options.options,
				ignoreRunError
			);
		})
		.catch(function(err) {
			stdout.error(printTpl.errorInfo(err));
			throw err;
		});
};

exports.listAction = function listAction(conf_file, options) {
	options || (options = {});
	const linker = requireLinker(conf_file);

	return commandActions
		.filterAllMehtods(linker, options.clients)
		.then(function(allMethods) {
			const flows = parseFilterFlows(options.flows, allMethods.allFlows);
			const output = printTable(allMethods.lines, flows, options);
			stdout.log(output);

			return {
				output: output,
				linker: linker,
				methods: allMethods
			};
		})
		.catch(function(err) {
			stdout.error(printTpl.errorInfo(err));
			throw err;
		});
};

/**
 * 解析cli的flow字符串
 *
 * 只包含可用的flow，如果没有可用flow，则返回全部flows
 *
 * @param  {String} flowsStr
 * @param  {Array}  allFlows
 * @return {Array}
 */
function parseFilterFlows(flowsStr, allFlows) {
	let flows = flowsStr && flowsStr.split(/ *, */);
	if (flows) flows = _.intersection(flows, allFlows);
	if (!flows || !flows.length) flows = allFlows;

	return flows;
}
exports.parseFilterFlows = parseFilterFlows;

exports.filterAllMehtods = async function filterAllMehtods(linker, clients) {
	const list = await linker.methods()
	let reallist;

	if (!clients) reallist = list;
	else {
		reallist = {};
		clients.split(/ *, */).forEach(function(name) {
			reallist[name] = list[name];
		});
	}

	const allMethods = await rlutils.getAllMethods(reallist);
	if (!allMethods || !allMethods.length) {
		throw new Error('No Client Has Methods');
	} else {
		return allMethods;
	}
};

exports.runAction = function runAction(
	linker,
	action,
	query,
	body,
	options,
	ignoreRunError
) {
	options || (options = {});
	const args = [action, query, body, options];
	const str = printTpl.runActionStart(action, query, body, options);
	stdout.log(str);

	// 兼容老的linker
	const retPromise = linker.run.apply(linker, args);
	const runtime = retPromise.lastRuntime;

	return retPromise.then(
		function(data) {
			const str = printTpl.runActionEnd(
				action,
				'data',
				runtime,
				data
			);
			stdout.log(str);

			return data;
		},
		function(err) {
			const str = printTpl.runActionEnd(
				action,
				'error',
				runtime,
				err
			);
			stdout.error(str);

			if (!ignoreRunError) throw err;
		}
	);
};

function requireLinker(conf_file) {
	const linker = require(rlutils.resolve(conf_file));

	if (linker.version != pkg.version) {
		const str = printTpl.linkerVersionNotMatch(pkg.version, linker.version);
		stdout.warn(str);
	}

	return linker;
}
