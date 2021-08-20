const path = require('path');
const ExtensionReloader  = require('webpack-extension-reloader');
const CopyPlugin = require('copy-webpack-plugin');

let dist = './dev_ext_reloader';
let entry = {
    content: './content.js',
    background: './background.js'
};

/**
 *
 * @returns {{output: {path: string, filename: string}, mode: string, devtool: string, entry: {background: string, content: string}, watch: boolean, optimization: {minimize: boolean}, plugins: *[], module: {rules: [{test: RegExp, use: {loader: string}, exclude: RegExp}, {test: RegExp, use: string[]}, {test: RegExp, loader: string, options: {name: string}}]}, target: string}}
 */
module.exports = () => {
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
                },
                {
                    from: 'content.css'
                }
            ]),
            new ExtensionReloader({
                port: 9090,
                reloadPage: true,
                manifest: path.resolve(__dirname, 'dev_ext_reloader/manifest.json'),
                entries: {
                    contentScript: 'content',
                    background: 'background-script'
                }
            })
        ],
        mode: 'development',
        devtool: 'source-map',
        optimization: {
            minimize: false
        }
    };
};