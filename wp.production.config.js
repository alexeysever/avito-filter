const path = require('path');
const TerserPlugin =    require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

let dist = './production';
let entry = {
    content: './content.js'
};

/**
 *
 * @returns {{output: {path: string, filename: string}, mode: string, devtool: *, entry: {content: string}, optimization: {minimize: boolean, minimizer: [TerserPlugin]}, plugins: [*], module: {rules: [{test: RegExp, use: {loader: string}, exclude: RegExp}, {test: RegExp, use: [string]}]}, target: string}}
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
            new CopyPlugin([
                {
                    from: "./manifest.json"
                },
            ])
        ],
        mode: 'production',
        devtool: false,
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin()
            ]
        }
    }
};