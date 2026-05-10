/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import Config from '@doublescale/config';

type ApiFetchOptions = Parameters<typeof apiFetch>[0];

/**
 * Calls {@link apiFetch} only when {@link Config.isModuleEnabled} is true for `moduleSlug`.
 * Returns `null` when the module is off so callers avoid useless REST noise.
 */
export async function moduleFetch<T>(
	moduleSlug: string,
	options: ApiFetchOptions
): Promise<T | null> {
	if (!Config.isModuleEnabled(moduleSlug)) {
		return null;
	}
	return apiFetch<T>(options);
}
