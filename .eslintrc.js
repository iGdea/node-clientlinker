module.exports = {
	extends: './.eslint.brcjs.js',
	overrides: [{
		files: ['packages/clientlinker-flow-confighandler-test/**/*.js'],
		env: {
			mocha: true
		}
	}],
};
