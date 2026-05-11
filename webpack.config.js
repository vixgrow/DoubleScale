/**
 * External dependencies
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RtlCssPlugin = require('rtlcss-webpack-plugin');

const webpack = require('webpack');

const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

/**
 * Aliases used by both the admin SPA build and the public booking renderer.
 *
 * Centralized so both targets resolve the same `@/`, `@doublescale/*`, and
 * booking-scoped paths consistently. Booking-scoped aliases are listed BEFORE
 * the foundation-layer fallbacks (`@/types/booking` before `@/types/*` →
 * `shared/types/*`) so webpack's longest-prefix matching picks the right one.
 */
const sharedAlias = {
	// Shared foundation layer (`src/shared/`). Listed before `@` so imports resolve here first.
	'@/components/ui': path.resolve(__dirname, 'src/shared/ui'),
	'@/components/icons': path.resolve(__dirname, 'src/shared/icons'),
	'@/lib': path.resolve(__dirname, 'src/shared/lib'),

	// Booking-scoped aliases — must precede the generic `@/<type>/*` fallbacks
	// to `shared/<type>/*`. The booking module imports `@/types/booking`,
	// `@/hooks/booking`, etc. — those live at the top-level `src/<type>/booking/`
	// (NOT under `src/shared/`).
	'@/types/booking': path.resolve(__dirname, 'src/types/booking'),
	'@/hooks/booking': path.resolve(__dirname, 'src/hooks/booking'),
	'@/utils/booking': path.resolve(__dirname, 'src/utils/booking'),
	'@/stores/booking/event': path.resolve(__dirname, 'src/stores/booking/event'),
	'@/config/booking': path.resolve(__dirname, 'src/config/booking'),
	'@/constants/booking': path.resolve(__dirname, 'src/constants/booking.ts'),
	'@/renderer/booking': path.resolve(__dirname, 'src/renderer/booking'),

	// Generic foundation-layer fallbacks.
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
};

const sharedFallback = {
	'react/jsx-runtime': 'react/jsx-runtime.js',
	'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
};

const sharedDefinePlugin = new webpack.DefinePlugin({
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
});

/**
 * Build the `@wordpress/scripts` default plugin list with our filename
 * overrides for the given chunk. Each config target gets *fresh*
 * `MiniCssExtractPlugin` and `RtlCssPlugin` instances because the originals
 * from `defaultConfig.plugins` are mutated in place — sharing them across
 * configs causes the renderer's constant `style.css` filename to leak back
 * into the admin build, producing `Multiple chunks emit assets to the same
 * filename` errors at compile time.
 */
function buildPlugins(cssFilename, rtlFilename) {
	return defaultConfig.plugins
		.filter(
			(plugin) =>
				!(plugin instanceof MiniCssExtractPlugin) &&
				!(plugin instanceof RtlCssPlugin)
		)
		.concat(
			new MiniCssExtractPlugin({ filename: cssFilename }),
			new RtlCssPlugin({ filename: rtlFilename })
		);
}

const adminClientConfig = {
	...defaultConfig,
	name: 'admin-client',
	module: {
		...defaultConfig.module,
	},
	resolve: {
		...defaultConfig.resolve,
		extensions: ['.tsx', '.ts', '.js'],
		alias: sharedAlias,
		fallback: sharedFallback,
	},
	entry: {
		index: path.resolve(__dirname, 'src/client/index.tsx'),
	},
	plugins: [
		...buildPlugins(
			(pathData) => `${pathData.chunk.name.replace(/\.[^/.]+$/, '')}.css`,
			(pathData) => `${pathData.chunk.name.replace(/\.[^/.]+$/, '')}-rtl.css`
		),
		sharedDefinePlugin,
	],
	output: {
		...defaultConfig.output,
		path: path.resolve(__dirname, 'build/client'),
		filename: 'index.js',
	},
};

/**
 * Public booking renderer build. Runs as a separate config so its assets land
 * under `build/renderer/` (where `BookingFrontendHandler.php` expects them).
 *
 * The renderer is a self-contained SPA that mounts onto storefront DOM nodes
 * (`#doublescale-booking-booking-page`, etc.) — it shares the foundational
 * layer (types, hooks, config, utils, components) with the admin SPA via the
 * `sharedAlias` map.
 */
const bookingRendererConfig = {
	...defaultConfig,
	name: 'booking-renderer',
	entry: {
		index: path.resolve(__dirname, 'src/renderer/booking/index.tsx'),
	},
	module: {
		...defaultConfig.module,
	},
	resolve: {
		...defaultConfig.resolve,
		extensions: ['.tsx', '.ts', '.js'],
		alias: sharedAlias,
		fallback: sharedFallback,
	},
	plugins: [
		...buildPlugins(
			() => 'style.css',
			() => 'style-rtl.css'
		),
		sharedDefinePlugin,
	],
	output: {
		...defaultConfig.output,
		path: path.resolve(__dirname, 'build/renderer'),
		filename: '[name].js',
	},
};

module.exports = [adminClientConfig, bookingRendererConfig];
