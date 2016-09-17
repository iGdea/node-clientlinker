"use strict";

var rlutils = require('./rlutils');
var printTpl = exports;


exports.runtime = function printRuntime(runtime)
{
	var retryTimes = runtime.retry.length;
	var alltime = runtime.timing.flowsEnd - runtime.navigationStart;
	var lastRetry = runtime.retry[runtime.retry.length-1];
	var flowStr = [];
	for (var runnedFlows = lastRetry.runnedFlows, len = runnedFlows.length; len--;)
	{
		var flowItem = runnedFlows[len];
		if (!flowItem || !flowItem.flow) continue;

		if (!flowStr.length)
		{
			flowStr.push(rlutils.colors.green(flowItem.flow.name)
				+ ' '
				+ rlutils.colors.blue(flowItem.timing.end - flowItem.timing.start)
				+ 'ms');
		}
		else
		{
			flowStr.push(rlutils.colors.gray(flowItem.flow.name));
		}
	}

	var lines = [];
	lines.push([
		rlutils.colors.cyan.underline('[Runtime]'),
		'use:',
			alltime > 250 ? rlutils.colors.red(alltime) : rlutils.colors.green(alltime),
			'ms,',
		'retry:',
			retryTimes != 1 ? rlutils.colors.red(retryTimes) : rlutils.colors.green(retryTimes)
	].join(' '));

	lines.push(rlutils.colors.cyan.underline('[FlowRun]') + ' ' +flowStr.join(' > '));

	return lines.join('\n');
}


exports.errorInfo = function printErrorInfo(err)
{
	if (!err)
		return 'Error: '+err;
	if (err.message == 'No Client Has Methods')
		return '\n    ** '+err.message+' **    \n';
	else if (err.message == 'Not Found Action')
		return err.message+', '+ rlutils.colors.red(err.action);
	else
		return err.stack || err.message || 'Error: '+err;
}

exports.runActionStart = function printRunActionStart(action, query, body, options)
{
	return [
		'',
		' ========= Action Run '+rlutils.colors.green(action)+' =========',
		' >>> Query <<< ',
		rlutils.printObject(query),
		'',
		' >>> Body <<< ',
		rlutils.printObject(body),
		'',
		' >>> Options <<<',
		rlutils.printObject(options),
		''
	].join('\n');
}


exports.runActionEnd = function printRunActionEnd(action, type, runtime, data)
{
	var str = [
			' =========',
			'Action Result',
			type == 'error' ? 'Error' : 'Success',
			rlutils.colors.green(action),
			'========= '
		].join(' ');

	if (type == 'error')
		str = rlutils.colors.red(str);

	str += '\n'
		+ printTpl.runtime(runtime)
		+ '\n\n'
		+ rlutils.printObject(data);

	return str;
}


exports.runActionUnexpectedError = function printRunActionUnexpectedError(action, err)
{
	var title = [
			' =========',
			'Unexpected Error',
			rlutils.colors.green(action),
			'========= '
		].join(' ');

	return '\n'
		+ rlutils.colors.red(title)
		+ '\n'
		+ rlutils.printObject(err);
}


exports.rlRunHeader = function printRlRunHeader()
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
