module.exports = {
	env: {
		browser: true,
		es6: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:svelte/recommended',
	],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
		},
	],
	rules: {
		indent: [
			'error',
			'tab'
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		quotes: [
			'error',
			'single'
		],
		semi: [
			'error',
			'always'
		],
		eqeqeq: [
			'error',
			'smart'
		]
	}
};
