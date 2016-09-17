"use strict";

var table = require('table');
var useSymbole
	= exports.useSymbole
	= process.platform == 'win32' ? '\u221A' : '✓';

exports.printTable = printTable;
function printTable(data, allFlowFrom)
{
	var defaultFlowFromArr = [];
	var flowFromIndexMap = {};

	allFlowFrom.forEach(function(from, index)
		{
			defaultFlowFromArr.push('');
			flowFromIndexMap[from] = index;
		});

	var tableData = [];
	data.forEach(function(item)
		{
			switch(item.type)
			{
				case 'header':
					// 空一行
					if (tableData.length)
						tableData.push([' ', '', ''].concat(defaultFlowFromArr));

					tableData.push(['', item.client, ' '].concat(allFlowFrom));
					break;
				case 'nomethods':
					tableData.push(['', '** No Methods **', ''].concat(defaultFlowFromArr));
					break;
				default:
					var realFlowList = defaultFlowFromArr.slice();
					var froms = item.froms.map(function(name)
						{
							if (name === undefined) name = 'undefined';
							realFlowList[flowFromIndexMap[name]] = name+' '+useSymbole;
							return name;
						});
					tableData.push([item.index, item.method, '' && froms.join(',')].concat(realFlowList));
			}
		});

	var output = table.default(tableData,
		{
			border: table.getBorderCharacters('void'),
			columnDefault:
			{
				paddingLeft: 1,
				paddingRight: 1
			},
			drawHorizontalLine: function()
			{
				return 0;
			}
		});

	return output;
}
