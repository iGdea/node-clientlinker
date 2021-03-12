const clientlinker = require('../');
const statistic = require('async-statistic');
const expect = require('expect.js');

describe('#statistic', () => {
	it('#base', async () => {
		const linker = clientlinker({
			flows: ['confighandler'],
			clients: {
				client: {
					confighandler: {
						method: function() {}
					}
				}
			}
		});

		linker.flow(
			'confighandler',
			require('clientlinker-flow-confighandler-test').flows.confighandler
		);

		const data = await statistic(() => linker.run('client.method'), { stack: true });

		// console.log(data.inRun[0]);
		// 注意：debug也会加入，所以这里需要特别留意
		// async会生成两个promise
		expect(data.inRun.length).to.be(2);
	});
});
