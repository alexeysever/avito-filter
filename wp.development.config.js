const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
let nodeExternals = require('webpack-node-externals');

let dist = './development';
let entry = {
    content: './content.js',
    background: './background.js'
};

/**
 *
 * @returns {{output: {path: string, filename: string}, mode: string, devtool: string, entry: {background: string, content: string}, optimization: {minimize: boolean}, plugins: [CopyPlugin], module: {rules: [{test: RegExp, use: {loader: string}, exclude: RegExp}, {test: RegExp, use: [string]}, {test: RegExp, loader: string, options: {name: string}}]}}}
 */
module.exports = () => {
    return {
        entry: entry,
        output: {
            filename: '[name].js',
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
            new CopyPlugin({
                patterns: [
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
                        from: 'manifest.json'
                    }
                ]
            }),
        ],
        mode: 'development',
        devtool: 'source-map',
        optimization: {
            minimize: false,
        }
    }
};