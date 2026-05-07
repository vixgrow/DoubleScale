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
			'@': path.resolve(__dirname, 'src'),
			'@/lib': path.resolve(__dirname, 'src/lib'),
			'@doublescale/navigation': path.resolve(__dirname, 'src/navigation'),
			'@doublescale/config': path.resolve(__dirname, 'src/config'),
			'@doublescale/client': path.resolve(__dirname, 'src/client/index.tsx'),
			'@doublescale/components': path.resolve(__dirname, 'src/components'),
			'@doublescale/hooks': path.resolve(__dirname, 'src/hooks'),
			'@doublescale/utils': path.resolve(__dirname, 'src/utils'),
			'@doublescale/services': path.resolve(__dirname, 'src/services'),
			'@doublescale/assets': path.resolve(__dirname, 'assets'),
		},
		fallback: {
			'react/jsx-runtime': 'react/jsx-runtime.js',
			'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
		},
	},
	plugins: [
		// Remove css file from default config
		...defaultConfig.plugins.map((plugin) => {
			if (plugin instanceof MiniCssExtractPlugin) {
				plugin.options.filename = (pathData) => {
					const name = pathData.chunk.name.replace(/\.[^/.]+$/, '');
					return `${name}.css`;
				};
				return plugin;
			}

			if (plugin instanceof RtlCssPlugin) {
				plugin.options.filename = (pathData) => {
					const name = pathData.chunk.name.replace(/\.[^/.]+$/, '');
					return `${name}-rtl.css`;
				};
				return plugin;
			}

			return plugin;
		}),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(
				process.env.NODE_ENV || 'development'
			),
			process: {
				env: {
					NODE_ENV: JSON.stringify(
						process.env.NODE_ENV || 'development'
					),
				},
			},
		}),
	],
	output: {
		...defaultConfig.output,
		filename: 'index.js',
	},
};
