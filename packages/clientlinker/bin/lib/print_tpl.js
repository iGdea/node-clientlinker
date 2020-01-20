'use strict';

let util		= require('util');
let rlutils		= require('./rlutils');
let printTpl	= exports;


exports.runtime = function runtime(runtime)
{
	if (!runtime) return '';

	let retryTimes = runtime.retry.length;
	let alltime = runtime.timing.getEndTime() - runtime.navigationStart;
	let lastRetry = runtime.retry[runtime.retry.length-1];
	let flowStr = [];
	for (let runned = lastRetry.runned, len = runned.length; len--;)
	{
		let runner = runned[len];
		if (!runner || !runner.flow) continue;

		if (!flowStr.length)
		{
			let str = util.format('%s %sms',
				rlutils.colors.green(runner.flow.name),
				rlutils.colors.blue(runner.endTime - runner.startTime));

			flowStr.push(str);
		}
		else
		{
			let str = rlutils.colors.gray(runner.flow.name);
			flowStr.push(str);
		}
	}

	return util.format('%s use: %s ms, retry: %s\n%s %s',
		rlutils.colors.cyan.underline('[Runtime]'),
		alltime > 250
			? rlutils.colors.red(alltime)
			: rlutils.colors.green(alltime),
		retryTimes != 1
			? rlutils.colors.red(retryTimes)
			: rlutils.colors.green(retryTimes),
		rlutils.colors.cyan.underline('[FlowRun]'),
		flowStr.join(' > '));
}


exports.errorInfo = function errorInfo(err)
{
	if (!err)
		return 'Error: '+err;
	if (err.message == 'No Client Has Methods')
		return '\n    ** '+err.message+' **    \n';
	else if (err.message == 'Not Found Action')
		return err.message+', '+rlutils.colors.red(err.action);
	else if (err.__parseParamError__)
		return rlutils.colors.red('[Parse param error] ')+err.stack;
	else
		return err.stack || err.message || 'Error: '+err;
}

exports.runActionStart = function runActionStart(action, query, body, options)
{
	return util.format(
		'\n ========= Action Run %s =========\n'
		+ ' >>> Query <<< \n%s\n\n'
		+ ' >>> Body <<< \n%s\n\n'
		+ ' >>> Options <<< \n%s\n\n',
			rlutils.colors.green(action),
			rlutils.printObject(query),
			rlutils.printObject(body),
			rlutils.printObject(options)
		);
}


exports.runActionEnd = function runActionEnd(action, type, runtime, data)
{
	let title = util.format(
		' ========= Action Result %s %s =========',
		type == 'error' ? 'Error' : 'Success',
		rlutils.colors.green(action));

	if (type == 'error') title = rlutils.colors.red(title);

	return util.format('%s\n%s\n\n%s', title,
		printTpl.runtime(runtime),
		rlutils.printObject(data));
}


exports.runActionUnexpectedError = function runActionUnexpectedError(action, err)
{
	let title = util.format(
		' ========= Unexpected Error %s ========= ',
		rlutils.colors.green(action));

	return '\n'
		+ rlutils.colors.red(title)
		+ '\n'
		+ rlutils.printObject(err);
}


exports.linkerVersionNotMatch = function linkerVersionNotMatch(pkgVersion, linkerVersion)
{
	let str = util.format('\n\n  version not match, cli version:%s, config file version:%s\n\n',
		rlutils.colors.green(pkgVersion),
		rlutils.colors.green(linkerVersion));

	return rlutils.colors.red(str);
}


exports.rlRunHeader = function rlRunHeader()
{
	return [
			'', '', '',

			' ***********************',
			' *                     *',
			' *     Action Test     *',
			' *                     *',
			' ***********************'
		].join('\n');
}
