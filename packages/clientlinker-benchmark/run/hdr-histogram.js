const linker = require('../lib/linker');
const hdr = require('hdr-histogram-js');

(async () => {
	const h = hdr.build();
	let lastTime = process.hrtime.bigint();

	for(let i = 1000; i--;) {
		await linker.run('client.method');

		const now = process.hrtime.bigint();
		h.recordValue(Number(now - lastTime));
		lastTime = now;
	}

	console.log(h.getValueAtPercentile(90) + 'ns');
})();
