const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const ExtensionReloader  = require('webpack-extension-reloader');
const CopyPlugin = require('copy-webpack-plugin');

let dist = './production';
let entry = {content: './content.js'};

/**
 *
 * @param env
 * @param env.production {true|"false"}
 * @param env.testBuild {true|"false"}
 * @returns {{output: {path: string, filename: string}, mode: string, devtool: *, entry: {content: string}, optimization: {minimize: boolean, minimizer: [TerserPlugin]}, plugins: [*], module: {rules: [{test: RegExp, use: {loader: string}, exclude: RegExp}, {test: RegExp, use: [string]}]}, target: string}}
 */
module.exports = env => {
    if (env.testBuild === true) {
        dist = './test-dist/';
        entry = './test/goTo.test.js';
    }
    return {
        target: "web",
        entry: entry,
        output: {
            filename: 'content.js',
            path: path.resolve(__dirname, dist)
        },
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
            new CopyPlugin([
                { from: "./manifest.json" },
            ]),
            new ExtensionReloader({
                port: 9090,
                reloadPage: true,
                entries: {
                    content: 'content'
                }
            })
        ],
        mode: env.production === true ? 'production' : 'development',
        devtool: env.production === true ? false : 'source-map',
        optimization: {
            minimize: env.production === true,
            minimizer: [
                new TerserPlugin()
            ]
        }
    }
};