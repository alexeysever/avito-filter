const path = require('path');
let nodeExternals = require('webpack-node-externals');

let dist = './test-dist';
let entry = {
    test: './test/puppeteerTest',
};

/**
 *
 * @returns {{output: {path: string, filename: string}, mode: string, devtool: string, entry: {test: string}, optimization: {minimize: boolean}, module: {rules: [{test: RegExp, use: {loader: string}, exclude: RegExp}, {test: RegExp, use: [string]}, {test: RegExp, loader: string, options: {name: string}}]}, target: string}}
 */
module.exports = () => {
    return {
        target: "node",
        node: {
            global: false,
            __filename: false,
            __dirname: false,
        },
        externals: [nodeExternals()],
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
        mode: 'development',
        devtool: 'source-map',
        optimization: {
            minimize: false,
        }
    }
};