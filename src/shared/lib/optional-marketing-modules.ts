/**
 * Optional add-ons shown on Get Started and Settings → Modules (fixed product list).
 * When Pro is not active, some slugs are missing from the REST payload — we still
 * render a card with copy that the feature requires DoubleScale Pro.
 */

import { __ } from '@wordpress/i18n';
import type { ModuleInfo } from '@doublescale/config';

export const OPTIONAL_MARKETING_MODULE_SLUGS = [
	'smtp',
	'deals',
	'forms',
	'automations',
	'tasks',
	'campaigns',
	'booking',
	'support',
] as const;

/**
 * Pro-only toggles the PHP REST layer persists even when the module class is not loaded yet.
 * Keep aligned with {@see doublescale_phantom_module_toggle_slugs()} in PHP.
 */
export const REST_PHANTOM_MODULE_SLUGS = [
	'analytics',
	'deals',
	'inbox',
	'integrations',
	'leadscoring',
	'notifications',
	'tasks',
] as const;

const ALL_REST_PERSISTABLE_OPTIONAL_SLUGS: ReadonlySet<string> = new Set([
	...OPTIONAL_MARKETING_MODULE_SLUGS,
	...REST_PHANTOM_MODULE_SLUGS,
]);

/** Pro marketing rows: feature ships in Pro; free install still shows toggle + install copy until Pro is active. */
const PRO_ONLY_OPTIONAL_MARKETING_SLUGS: ReadonlySet<string> = new Set(['deals', 'tasks']);

export type OptionalMarketingModuleSlug =
	(typeof OPTIONAL_MARKETING_MODULE_SLUGS)[number];

export type DisplayMarketingModule = ModuleInfo & {
	/** True when this slug is not a toggleable row from the API (Pro not available / module not registered). */
	unavailableUntilPro: boolean;
};

function placeholderFor(
	slug: OptionalMarketingModuleSlug
): Pick<ModuleInfo, 'label' | 'description'> {
	switch (slug) {
		case 'smtp':
			return {
				label: __('SMTP', 'doublescale'),
				description: __(
					'Route outgoing CRM and campaign mail through your own SMTP connections and providers.',
					'doublescale'
				),
			};
		case 'deals':
			return {
				label: __('Pipelines', 'doublescale'),
				description: __(
					'Manage deals, stages, and pipeline analytics for your sales process.',
					'doublescale'
				),
			};
		case 'forms':
			return {
				label: __('Forms', 'doublescale'),
				description: __(
					'Build and embed contact-capture forms that sync with your CRM.',
					'doublescale'
				),
			};
		case 'automations':
			return {
				label: __('Automations', 'doublescale'),
				description: __(
					'Visual workflows with triggers, actions, goals, and conditional rules.',
					'doublescale'
				),
			};
		case 'tasks':
			return {
				label: __('Tasks', 'doublescale'),
				description: __(
					'Create tasks, due dates, and reminders linked to contacts and deals.',
					'doublescale'
				),
			};
		case 'campaigns':
			return {
				label: __('Campaigns', 'doublescale'),
				description: __(
					'Run email and SMS campaigns, sequences, and templates from the CRM.',
					'doublescale'
				),
			};
		case 'booking':
			return {
				label: __('Booking', 'doublescale'),
				description: __(
					'Let visitors book meetings and services with calendars, availability, and reminders.',
					'doublescale'
				),
			};
		case 'support':
			return {
				label: __('Support', 'doublescale'),
				description: __(
					'Ticket-based customer support with mailbox channels, email piping, and a customer portal.',
					'doublescale'
				),
			};
	}
}

/**
 * Always returns one row per slug in product order: merge API {@link ModuleInfo} when the
 * module is toggleable; otherwise a placeholder marked {@link DisplayMarketingModule.unavailableUntilPro}.
 *
 * @param isProAddonActive When true, Pro plugin is active (rows that only ship in Pro are treated as available).
 */
export function buildMarketingModuleDisplayRows(
	modules: ModuleInfo[],
	isProAddonActive = false
): DisplayMarketingModule[] {
	return OPTIONAL_MARKETING_MODULE_SLUGS.map((slug) => {
		const m = modules.find((x) => x.slug === slug);
		if (m?.is_toggleable) {
			const unavailableUntilPro =
				PRO_ONLY_OPTIONAL_MARKETING_SLUGS.has(slug) && !isProAddonActive;
			return { ...m, unavailableUntilPro };
		}
		const p = placeholderFor(slug);
		return {
			slug,
			label: p.label,
			description: p.description,
			enabled: false,
			is_toggleable: false,
			dependencies: [],
			unavailableUntilPro: true,
		};
	});
}

export function getEffectiveMarketingModuleState(
	row: DisplayMarketingModule,
	apiModules: ModuleInfo[],
	pending: Record<string, boolean>
): boolean {
	if (row.unavailableUntilPro) {
		if (pending[row.slug] !== undefined) {
			return pending[row.slug];
		}
		const fromApiWhenDeferred = apiModules.find((m) => m.slug === row.slug);
		if (fromApiWhenDeferred?.is_toggleable) {
			return fromApiWhenDeferred.enabled;
		}
		return false;
	}
	if (pending[row.slug] !== undefined) {
		return pending[row.slug];
	}
	const fromApi = apiModules.find((m) => m.slug === row.slug);
	return fromApi ? fromApi.enabled : true;
}

const OPTIONAL_SLUG_SET: ReadonlySet<string> = new Set(OPTIONAL_MARKETING_MODULE_SLUGS);

/**
 * Normalizes pending toggles: real modules when the user has not yet expressed
 * an explicit opinion (so first-run wizard always commits its defaults) or when
 * the value differs from the API; Pro placeholders only when turned on (visual
 * preference until Pro is installed).
 */
export function reduceMarketingModulePending(
	next: Record<string, boolean>,
	apiModules: ModuleInfo[]
): Record<string, boolean> {
	const out: Record<string, boolean> = {};
	for (const [s, v] of Object.entries(next)) {
		const original = apiModules.find((m) => m.slug === s);
		if (original?.is_toggleable) {
			if (!original.is_explicit || original.enabled !== v) {
				out[s] = v;
			}
		} else if (OPTIONAL_SLUG_SET.has(s) && v) {
			out[s] = true;
		}
	}
	return out;
}

/** REST body: registered toggleable modules plus deferred Pro slugs the server persists without the class loaded. */
export function pickToggleableModulePayload(
	pending: Record<string, boolean>,
	apiModules: ModuleInfo[]
): Record<string, boolean> {
	const allowed = new Set(
		apiModules.filter((m) => m.is_toggleable).map((m) => m.slug)
	);
	for (const slug of ALL_REST_PERSISTABLE_OPTIONAL_SLUGS) {
		allowed.add(slug);
	}
	return Object.fromEntries(Object.entries(pending).filter(([slug]) => allowed.has(slug)));
}
