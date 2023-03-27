/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

let dist = './production';
let entry = {
	content: './content.js'
};

/**
 *
 * @returns {{output: {path: string, filename: string}, mode: string, devtool: boolean, entry: {content: string}, watch: boolean, optimization: {minimize: boolean, minimizer: *[]}, plugins: *[], module: {rules: [{test: RegExp, use: {loader: string}, exclude: RegExp}, {test: RegExp, use: string[]}]}}}
 */
module.exports = () => {
	return {
		//target: "web",
		entry: entry,
		output: {
			filename: '[name].js',
			path: path.resolve(__dirname, dist)
		},
		watch: false,
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: /(node_modules|bower_components)/,
					use: {
						loader: 'babel-loader',
					}
				},
				{
					test: /\.(png|svg|jpg|gif)$/,
					use: [
						'file-loader'
					]
				}
			],
		},
		plugins: [
			new CopyPlugin({
				patterns: [
					{
						from: './manifest.json'
					},
					{
						from: 'icon16.png'
					},
					{
						from: 'icon48.png'
					},
					{
						from: 'icon128.png'
					},
					{
						from: 'melody.mp3'
					},
					{
						from: 'content.css'
					},
					{
						from: 'README.md'
					}
				]
			})
		],
		mode: 'production',
		devtool: false,
		optimization: {
			minimize: true,
			minimizer: [
				new TerserPlugin()
			]
		}
	};
};