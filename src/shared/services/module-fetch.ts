/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import Config from '@doublescale/config';

type ApiFetchOptions = Parameters<typeof apiFetch>[0];

/**
 * Human-readable module title for notices (uses PHP-provided label when present).
 */
export function getModuleDisplayName(moduleSlug: string): string {
	const mod = Config.getModules().find((m) => m.slug === moduleSlug);
	if (mod?.label) {
		return mod.label;
	}
	return moduleSlug.replace(/[-_]/g, ' ');
}

/**
 * Notice text when {@link moduleFetch} skips the request because the module is off in admin config.
 * Does not run when the slug is missing from the list — {@link Config.isModuleEnabled} treats that as on.
 */
export function getModuleFetchBlockedNotice(moduleSlug: string): string {
	const name = getModuleDisplayName(moduleSlug);
	return sprintf(
		/* translators: %s: module label, e.g. "Automations" */
		__(
			'The %s module is disabled. Enable it under Settings → Modules. No request was sent.',
			'doublescale'
		),
		name
	);
}

/**
 * Reporting/analytics REST routes are registered by DoubleScale Pro. Skip calling them when Pro is off
 * so the SPA does not hit a `rest_no_route` response (which looks like a broken moduleFetch).
 */
export function getProRequiredForAnalyticsNotice(): string {
	return __(
		'Automation funnel analytics require DoubleScale Pro to be installed and active. No request was sent.',
		'doublescale'
	);
}

/**
 * Calls {@link apiFetch} only when {@link Config.isModuleEnabled} is true for `moduleSlug`.
 * Returns `null` without calling the API when the module is off.
 *
 * For slug `analytics`, also requires Pro active — those endpoints live in Pro only.
 */
export async function moduleFetch<T>(
	moduleSlug: string,
	options: ApiFetchOptions
): Promise<T | null> {
	if (!Config.isModuleEnabled(moduleSlug)) {
		return null;
	}
	if (moduleSlug === 'analytics') {
		const pro = Config.getProPluginData();
		if (!pro?.is_active) {
			return null;
		}
	}
	return apiFetch<T>(options);
}
