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
			// Shared foundation layer (`src/shared/`). Listed before `@` so imports resolve here first.
			'@/components/ui': path.resolve(__dirname, 'src/shared/ui'),
			'@/components/icons': path.resolve(__dirname, 'src/shared/icons'),
			'@/lib': path.resolve(__dirname, 'src/shared/lib'),
			'@/hooks': path.resolve(__dirname, 'src/shared/hooks'),
			'@/utils': path.resolve(__dirname, 'src/shared/utils'),
			'@/services': path.resolve(__dirname, 'src/shared/services'),
			'@/navigation': path.resolve(__dirname, 'src/shared/navigation'),
			'@/config': path.resolve(__dirname, 'src/shared/config'),
			'@/constants': path.resolve(__dirname, 'src/shared/constants'),
			'@/types': path.resolve(__dirname, 'src/shared/types'),
			'@doublescale/shared': path.resolve(__dirname, 'src/shared'),
			'@doublescale/shared/ui': path.resolve(__dirname, 'src/shared/ui'),
			'@doublescale/shared/icons': path.resolve(__dirname, 'src/shared/icons'),
			'@doublescale/shared/lib': path.resolve(__dirname, 'src/shared/lib'),
			'@doublescale/shared/hooks': path.resolve(__dirname, 'src/shared/hooks'),
			'@doublescale/shared/utils': path.resolve(__dirname, 'src/shared/utils'),
			'@doublescale/shared/services': path.resolve(__dirname, 'src/shared/services'),
			'@doublescale/shared/stores': path.resolve(__dirname, 'src/shared/stores'),
			'@doublescale/shared/navigation': path.resolve(__dirname, 'src/shared/navigation'),
			'@doublescale/shared/config': path.resolve(__dirname, 'src/shared/config'),
			'@doublescale/shared/types': path.resolve(__dirname, 'src/shared/types'),
			'@doublescale/navigation': path.resolve(__dirname, 'src/shared/navigation'),
			'@doublescale/config': path.resolve(__dirname, 'src/shared/config'),
			'@/stores/blocks-registry': path.resolve(
				__dirname,
				'src/shared/stores/blocks-registry'
			),
			'@doublescale/hooks/useAutoSave': path.resolve(
				__dirname,
				'src/builder/hooks/useAutoSave.ts'
			),
			'@doublescale/hooks/useButtonSettings': path.resolve(
				__dirname,
				'src/builder/hooks/useButtonSettings.ts'
			),
			'@doublescale/hooks/useImageResize': path.resolve(
				__dirname,
				'src/builder/hooks/useImageResize.ts'
			),
			'@doublescale/hooks/useTemplateActions': path.resolve(
				__dirname,
				'src/builder/hooks/useTemplateActions.ts'
			),
			'@doublescale/hooks/useUnsavedChanges': path.resolve(
				__dirname,
				'src/builder/hooks/useUnsavedChanges.ts'
			),
			'@doublescale/hooks': path.resolve(__dirname, 'src/shared/hooks'),
			'@doublescale/services': path.resolve(__dirname, 'src/shared/services'),
			'@doublescale/utils/dragAndDropHelpers': path.resolve(
				__dirname,
				'src/builder/utils/dragAndDropHelpers.ts'
			),
			'@doublescale/utils/idGenerator': path.resolve(
				__dirname,
				'src/builder/utils/idGenerator.ts'
			),
			'@doublescale/utils/templateUtils': path.resolve(
				__dirname,
				'src/builder/utils/templateUtils.ts'
			),
			'@doublescale/utils': path.resolve(__dirname, 'src/shared/utils'),
			'@doublescale/components/icons': path.resolve(__dirname, 'src/shared/icons'),
			'@': path.resolve(__dirname, 'src'),
			'@/builder': path.resolve(__dirname, 'src/builder'),
			'@doublescale/components/ui': path.resolve(__dirname, 'src/shared/ui'),
			'@doublescale/client': path.resolve(__dirname, 'src/client/index.tsx'),
			'@doublescale/components': path.resolve(__dirname, 'src/components'),
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
