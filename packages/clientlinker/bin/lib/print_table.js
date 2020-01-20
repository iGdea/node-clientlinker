'use strict';

let table = require('table');
let useSymbole = (exports.useSymbole =
	// = process.platform == 'win32' ? '\u221A' : '✓';
	'*');

exports.printTable = printTable;
function printTable(data, allFlows, options) {
	options || (options = {});
	let defaultFlowFromArr = [];
	let flowFromIndexMap = {};

	allFlows.forEach(function(from, index) {
		defaultFlowFromArr.push('');
		flowFromIndexMap[from] = index;
	});

	let tableData = [];
	data.forEach(function(item) {
		switch (item.type) {
			case 'header':
				// 空一行
				if (tableData.length) {
					let line = [' ', '', ''].concat(defaultFlowFromArr);
					tableData.push(line);
				}

				tableData.push(['', item.client, ' '].concat(allFlows));
				break;

			case 'nomethods': {
				let line = ['', '** No Methods **', ''].concat(
					defaultFlowFromArr
				);
				tableData.push(line);
				break;
			}

			default: {
				let realFlowList = defaultFlowFromArr.slice();
				let froms = item.froms.map(function(name) {
					if (name === undefined) name = 'undefined';

					let flowTabIndex = flowFromIndexMap[name];
					if (flowTabIndex || flowTabIndex === 0) {
						realFlowList[flowTabIndex] = name + ' ' + useSymbole;
					}

					return name;
				});

				let line = [
					item.index,
					options.useAction ? item.action : item.method,
					'' && froms.join(',')
				].concat(realFlowList);

				tableData.push(line);
			}
		}
	});

	let output = table.table(tableData, {
		border: table.getBorderCharacters('void'),
		columnDefault: {
			paddingLeft: 1,
			paddingRight: 1
		},
		drawHorizontalLine: function() {
			return 0;
		}
	});

	return output;
}
