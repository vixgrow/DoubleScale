/**
 * External dependencies
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RtlCssPlugin = require('rtlcss-webpack-plugin');

const webpack = require('webpack');

const fs = require('fs');
const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

const proSupportPortalCustomFields = path.resolve(
	__dirname,
	'../doublescale-pro/src/renderer/support/portal-new-ticket-custom-fields.tsx'
);
const supportPortalCustomFieldsAlias = fs.existsSync(
	proSupportPortalCustomFields
)
	? proSupportPortalCustomFields
	: path.resolve(
			__dirname,
			'src/renderer/support/portal-custom-fields-stub.ts'
		);

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
	'@/renderer/portal': path.resolve(__dirname, 'src/renderer/portal'),

	// Support-scoped aliases — same ordering rule as booking (must precede the
	// generic `@/<type>/*` fallbacks below).
	'@/types/support': path.resolve(__dirname, 'src/types/support'),
	'@/hooks/support': path.resolve(__dirname, 'src/hooks/support'),
	'@/components/support': path.resolve(__dirname, 'src/components/support'),
	'@/constants/support': path.resolve(__dirname, 'src/constants/support.ts'),

	// Sales-scoped aliases — same ordering rule as support/booking.
	'@/types/sales': path.resolve(__dirname, 'src/types/sales'),
	'@/hooks/sales': path.resolve(__dirname, 'src/hooks/sales'),
	'@/components/sales': path.resolve(__dirname, 'src/components/sales'),
	'@/constants/sales': path.resolve(__dirname, 'src/constants/sales.ts'),

	'@doublescale/email-sequences-page': path.resolve(
		__dirname,
		'src/client/pages/email-sequences-upgrade/index.tsx'
	),

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

/**
 * Override the default @wordpress/scripts splitChunks.cacheGroups.style `name`
 * function. The stock implementation calls `path.dirname(chunkName)`, which
 * throws `ERR_INVALID_ARG_TYPE` when `chunkName` is null — and it is null for
 * every async chunk produced by `React.lazy(() => import(…))`. The booking
 * admin pages use `React.lazy` for every sub-route, so without this override
 * the build crashes the moment booking is imported.
 */
function safeSplitChunks(base) {
	const cacheGroups = { ...(base?.cacheGroups || {}) };
	if (cacheGroups.style) {
		cacheGroups.style = {
			...cacheGroups.style,
			name(_, chunks, cacheGroupKey) {
				const chunkName = chunks[0]?.name;
				if (!chunkName) return cacheGroupKey;
				return `${path.dirname(chunkName)}/${cacheGroupKey}-${path.basename(chunkName)}`;
			},
		};
	}
	return { ...base, cacheGroups };
}

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
	optimization: {
		...defaultConfig.optimization,
		splitChunks: false,
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
			(pathData) => {
				const name = pathData.chunk.name || pathData.chunk.id;
				return `${String(name).replace(/\.[^/.]+$/, '')}.css`;
			},
			(pathData) => {
				const name = pathData.chunk.name || pathData.chunk.id;
				return `${String(name).replace(/\.[^/.]+$/, '')}-rtl.css`;
			}
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
	optimization: {
		...defaultConfig.optimization,
		splitChunks: false,
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

/**
 * Public support portal renderer build. Mirrors `bookingRendererConfig` but
 * outputs to `build/renderer/support/` (where `PortalFrontendHandler.php`
 * expects `index.js` + `style.css` + `index.asset.php`). Separate target so
 * we can ship a lean bundle to public pages without dragging the admin SPA's
 * weight onto storefront pages — only the shortcode page pays this cost.
 */
const supportRendererConfig = {
	...defaultConfig,
	name: 'support-renderer',
	entry: {
		index: path.resolve(__dirname, 'src/renderer/support/index.tsx'),
	},
	module: {
		...defaultConfig.module,
	},
	optimization: {
		...defaultConfig.optimization,
		splitChunks: false,
	},
	resolve: {
		...defaultConfig.resolve,
		extensions: ['.tsx', '.ts', '.js'],
		alias: {
			...sharedAlias,
			'@doublescale-pro/support-portal-custom-fields':
				supportPortalCustomFieldsAlias,
			'@pro/client': path.resolve(
				__dirname,
				'../doublescale-pro/src/client'
			),
		},
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
		path: path.resolve(__dirname, 'build/renderer/support'),
		filename: '[name].js',
	},
};

/**
 * Public proposal renderer — lean bundle for `[doublescale_proposal]` pages.
 */
const proposalRendererConfig = {
	...defaultConfig,
	name: 'proposal-renderer',
	entry: {
		index: path.resolve(__dirname, 'src/renderer/proposal/index.tsx'),
	},
	module: {
		...defaultConfig.module,
	},
	optimization: {
		...defaultConfig.optimization,
		splitChunks: false,
	},
	resolve: {
		...defaultConfig.resolve,
		extensions: ['.tsx', '.ts', '.js'],
		alias: {
			...sharedAlias,
		},
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
		path: path.resolve(__dirname, 'build/renderer/proposal'),
		filename: '[name].js',
	},
};

/**
 * Public invoice renderer — lean bundle for `[doublescale_invoice]` pages.
 */
const invoiceRendererConfig = {
	...defaultConfig,
	name: 'invoice-renderer',
	entry: {
		index: path.resolve(__dirname, 'src/renderer/invoice/index.tsx'),
	},
	module: {
		...defaultConfig.module,
	},
	optimization: {
		...defaultConfig.optimization,
		splitChunks: false,
	},
	resolve: {
		...defaultConfig.resolve,
		extensions: ['.tsx', '.ts', '.js'],
		alias: {
			...sharedAlias,
		},
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
		path: path.resolve(__dirname, 'build/renderer/invoice'),
		filename: '[name].js',
	},
};

/**
 * Public Client Portal renderer — unified logged-in customer shell
 * ([doublescale_client_portal]). Mirrors the lean proposal/invoice configs.
 */
const portalRendererConfig = {
	...defaultConfig,
	name: 'portal-renderer',
	entry: {
		index: path.resolve(__dirname, 'src/renderer/portal/index.tsx'),
	},
	module: {
		...defaultConfig.module,
	},
	optimization: {
		...defaultConfig.optimization,
		splitChunks: false,
	},
	resolve: {
		...defaultConfig.resolve,
		extensions: ['.tsx', '.ts', '.js'],
		alias: {
			...sharedAlias,
			// The Tickets section reuses the support ticket views, which import
			// the Pro custom-fields block through this alias (free stub when Pro
			// is absent). Mirror the support renderer config so it resolves here
			// — including `@pro/client`, which the Pro custom-fields file pulls in
			// when Pro is installed.
			'@doublescale-pro/support-portal-custom-fields':
				supportPortalCustomFieldsAlias,
			'@pro/client': path.resolve(
				__dirname,
				'../doublescale-pro/src/client'
			),
		},
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
		path: path.resolve(__dirname, 'build/renderer/portal'),
		filename: '[name].js',
		// Lazy section chunks (React.lazy → import()) are emitted as bare
		// `[id].js` by default, which the browser caches indefinitely with no
		// cache-buster — so returning customers keep a stale section bundle
		// after a plugin update (the entry `index.js` busts via its asset.php
		// `?ver` hash, but async chunks do not). Content-hash the async chunk
		// names so they invalidate whenever their contents change.
		chunkFilename: '[name].[contenthash].js',
	},
};

/**
 * Public contract renderer — lean bundle for `[doublescale_contract]` pages.
 */
const contractRendererConfig = {
	...defaultConfig,
	name: 'contract-renderer',
	entry: {
		index: path.resolve(__dirname, 'src/renderer/contract/index.tsx'),
	},
	module: {
		...defaultConfig.module,
	},
	optimization: {
		...defaultConfig.optimization,
		splitChunks: false,
	},
	resolve: {
		...defaultConfig.resolve,
		extensions: ['.tsx', '.ts', '.js'],
		alias: {
			...sharedAlias,
		},
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
		path: path.resolve(__dirname, 'build/renderer/contract'),
		filename: '[name].js',
	},
};

module.exports = [
	adminClientConfig,
	bookingRendererConfig,
	supportRendererConfig,
	proposalRendererConfig,
	invoiceRendererConfig,
	portalRendererConfig,
	contractRendererConfig,
];
