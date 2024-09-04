/**
 * External dependencies
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RtlCssPlugin = require('rtlcss-webpack-plugin');

const { compact } = require('lodash');
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
            '@quillcrm/store': path.resolve(__dirname, 'src/store'),
            '@quillcrm/config': path.resolve(__dirname, 'src/config'),
            '@quillcrm/client': path.resolve(__dirname, 'src/client/index.tsx'),
            '@quillcrm/components': path.resolve(__dirname, 'src/components'),
            '@quillcrm/utils': path.resolve(__dirname, 'src/utils'),
        },
    },
    plugins: [
        // Remove css file from default config
        ...defaultConfig.plugins.map(
            (plugin) => {
                if (plugin instanceof MiniCssExtractPlugin) {
                    // Change the filename of the css file
                    plugin.options.filename = 'style.css';
                    return plugin;
                }

                if (plugin instanceof RtlCssPlugin) {
                    // Change the filename of the rtl css file
                    plugin.options.filename = 'style-rtl.css';
                    return plugin;
                }

                return plugin;
            }
        ),
    ],
    output: {
        ...defaultConfig.output,
        filename: 'index.js',
    },
};