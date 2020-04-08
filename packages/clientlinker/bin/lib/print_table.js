'use strict';

const table = require('table');
const useSymbole = (exports.useSymbole =
	// = process.platform == 'win32' ? '\u221A' : '✓';
	'*');

exports.printTable = printTable;
function printTable(data, allFlows, options) {
	options || (options = {});
	const defaultFlowFromArr = [];
	const flowFromIndexMap = {};

	allFlows.forEach(function(from, index) {
		defaultFlowFromArr.push('');
		flowFromIndexMap[from] = index;
	});

	const tableData = [];
	data.forEach(function(item) {
		switch (item.type) {
			case 'header':
				// 空一行
				if (tableData.length) {
					const line = [' ', '', ''].concat(defaultFlowFromArr);
					tableData.push(line);
				}

				tableData.push(['', item.client, ' '].concat(allFlows));
				break;

			case 'nomethods': {
				const line = ['', '** No Methods **', ''].concat(
					defaultFlowFromArr
				);
				tableData.push(line);
				break;
			}

			default: {
				const realFlowList = defaultFlowFromArr.slice();
				const froms = item.froms.map(function(name) {
					if (name === undefined) name = 'undefined';

					const flowTabIndex = flowFromIndexMap[name];
					if (flowTabIndex || flowTabIndex === 0) {
						realFlowList[flowTabIndex] = name + ' ' + useSymbole;
					}

					return name;
				});

				const line = [
					item.index,
					options.useAction ? item.action : item.method,
					'' && froms.join(',')
				].concat(realFlowList);

				tableData.push(line);
			}
		}
	});

	const output = table.table(tableData, {
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
