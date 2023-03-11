module.exports = {
	'env': {
		'browser': true,
		'node': true,
		'es2021': true,
		'mocha': true,
		'webextensions': true
	},
	'extends': ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	'overrides': [
	],
	parser: '@typescript-eslint/parser',
	'parserOptions': {
		'ecmaVersion': 'latest',
		'sourceType': 'module'
	},
	plugins: ['@typescript-eslint'],
	root: true,
	'rules': {
		'indent': [
			'error',
			'tab'
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'always'
		]
	}
};
