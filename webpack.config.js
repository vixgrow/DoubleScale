/**
 * External dependencies
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RtlCssPlugin = require('rtlcss-webpack-plugin');

const { compact } = require('lodash');
const webpack = require('webpack'); // Import webpack here

const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
    ...defaultConfig,
    module: {
        ...defaultConfig.module,
    },
    resolve: {
        ...defaultConfig.resolve,
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@quillcrm/navigation': path.resolve(__dirname, 'src/navigation'),
            '@quillcrm/config': path.resolve(__dirname, 'src/config'),
            '@quillcrm/client': path.resolve(__dirname, 'src/client/index.tsx'),
            '@quillcrm/components': path.resolve(__dirname, 'src/components'),
            '@quillcrm/utils': path.resolve(__dirname, 'src/utils'),
        },
        fallback: {
            'react/jsx-runtime': 'react/jsx-runtime.js',
            'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
        }
    },
    plugins: [
        // Remove css file from default config
        ...defaultConfig.plugins.map(
            (plugin) => {
                if (plugin instanceof MiniCssExtractPlugin) {
                    // Change the filename of the css file
                    plugin.options.filename = '[name].css';
                    return plugin;
                }

                if (plugin instanceof RtlCssPlugin) {
                    // Change the filename of the rtl css file
                    plugin.options.filename = '[name]-rtl.css';
                    return plugin;
                }

                return plugin;
            }
        ),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            process: {
                env: {
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
                },
            },
        }),


    ],
    output: {
        ...defaultConfig.output,
        filename: 'index.js',
    },
};