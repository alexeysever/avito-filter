const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const ExtensionReloader  = require('webpack-extension-reloader');
const CopyPlugin = require('copy-webpack-plugin');

let dist = './development';
let entry = {
    content: './content.js',
    background: './background.js'
};

/**
 *
 * @param env
 * @param env.production {boolean|"false"}
 * @param env.testBuild {boolean|"false"}
 * @returns {{output: {path: string, filename: string}, mode: string, devtool: *, entry: {content: string}, optimization: {minimize: boolean, minimizer: [TerserPlugin]}, plugins: [*], module: {rules: [{test: RegExp, use: {loader: string}, exclude: RegExp}, {test: RegExp, use: [string]}]}, target: string}}
 */
module.exports = env => {
    if (env.testBuild === true) {
        dist = './test-dist/';
        entry = './test/goTo.test.js';
    }

    return {
        target: 'web',
        entry: entry,
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, dist)
        },
        watch: true,
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
                    ],
                },
                {
                    test: /\.(css)$/,
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]'
                    }
                }
            ],
        },
        plugins: [
            new CopyPlugin([
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
                }
            ]),
            new ExtensionReloader({
                port: 9090,
                reloadPage: true,
                manifest: path.resolve(__dirname, 'development/manifest.json'),
                entries: {
                    contentScript: 'content',
                    background: 'background-script'
                }
            })
        ],
        mode: 'development',
        devtool: env.production === true ? false : 'source-map',
        optimization: {
            minimize: env.production === true,
            minimizer: [
                new TerserPlugin()
            ]
        }
    };
};