/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import config from '@doublescale/config';

/**
 * Whether DoubleScale Pro is active for this admin session.
 *
 * Uses the `doublescale_is_pro_active` filter (Pro registers true when loaded),
 * with fallbacks to PHP-injected config and `doublescalePro.isPro`.
 */
export function isProActive(): boolean {
	const fromConfig = Boolean( config.getProPluginData()?.is_active );
	const fromWindow = Boolean(
		( window as { doublescalePro?: { isPro?: boolean } } ).doublescalePro?.isPro
	);
	const defaultActive = fromConfig || fromWindow;

	return applyFilters(
		'doublescale_is_pro_active',
		defaultActive
	) as boolean;
}

/**
 * React hook wrapper for {@see isProActive}.
 */
export function useIsProActive(): boolean {
	return isProActive();
}
