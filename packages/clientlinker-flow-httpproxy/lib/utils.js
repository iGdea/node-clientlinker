'use strict';

exports.formatLogTime = formatLogTime;
function formatLogTime(date)
{
	return date.getHours()
		+ ':' + date.getMinutes()
		+ ':' + date.getSeconds()
		+ '.' + date.getMilliseconds();
}
