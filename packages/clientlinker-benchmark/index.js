const { spawnSync } = require('child_process');
const glob = require('glob');
const path = require('path');

const versions = glob.sync('*', { cwd: `${__dirname}/versions` })
	.map(v => +v)
	.sort((a, b) => a > b ? 1 : -1);
const taskFiles = glob.sync('*.js', { cwd: `${__dirname}/run`, absolute: true });

// console.log(versions, taskFiles);


taskFiles.forEach(taskfile => {
	versions.forEach(version => {
		console.log();
		console.log(` >>> run clientlinker, task: ${path.basename(taskfile)} pkg ver: ${version}`);
		spawnSync(process.execPath, [`--require=${__dirname}/versions/${version}`, taskfile], { stdio: [ null, process.stdout, process.stderr ] });
	});
	// console.log(p.stdout.toString().trim());
});
