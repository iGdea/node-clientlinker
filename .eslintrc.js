module.exports =
{
	extends: 'eslint-config-brcjs',
	overrides: [
		{
			files: ['packages/clientlinker-flow-confighandler-test/**/*.js'],
			env: {
				mocha: true
			}
		}
	],
};
