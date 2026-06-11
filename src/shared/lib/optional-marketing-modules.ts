/**
 * Optional add-ons shown on Get Started and Settings → Modules (fixed product list).
 * When Pro is not active, some slugs are missing from the REST payload — we still
 * render a card with copy that the feature requires DoubleScale Pro.
 */

import { __ } from '@wordpress/i18n';
import type { ModuleInfo } from '@doublescale/config';

/**
 * TEMPORARY release gate for Sales proposals/invoices. Mirrors PHP
 * `doublescale_sales_documents_ready()` via the admin config payload; while
 * false the Sales module surfaces only as the pipeline's parent toggle (no
 * Proposals/Invoices nav, pages, or contact tab). Remove together with the
 * PHP gate when the documents feature ships.
 */
export function isSalesDocumentsReady(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	const cfg = (
		window as { doublescaleConfig?: { salesDocumentsReady?: boolean } }
	).doublescaleConfig;
	return Boolean(cfg?.salesDocumentsReady);
}

export const OPTIONAL_MARKETING_MODULE_SLUGS = [
	'smtp',
	'sales',
	'forms',
	'automations',
	'tasks',
	'campaigns',
	'booking',
	'support',
] as const;

/**
 * Child sub-features rendered as a nested toggle inside their parent's card.
 * Effective state = parent on AND child intent; the child intent DEFAULTS TO ON
 * (`setting_enabled` from the REST payload) until the user opts out.
 * Keep aligned with {@see doublescale_child_module_parent_map()} in PHP.
 */
export const CHILD_MODULES_BY_PARENT: Readonly<Record<string, readonly string[]>> = {
	sales: ['deals'],
};

const CHILD_MODULE_SLUGS: ReadonlySet<string> = new Set(
	Object.values(CHILD_MODULES_BY_PARENT).flat()
);

/** Child sub-features that only function with the Pro add-on installed. */
const PRO_ONLY_CHILD_MODULE_SLUGS: ReadonlySet<string> = new Set(['deals']);

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
	...CHILD_MODULE_SLUGS,
]);

/** Pro marketing rows: feature ships in Pro; free install still shows toggle + install copy until Pro is active. */
const PRO_ONLY_OPTIONAL_MARKETING_SLUGS: ReadonlySet<string> = new Set(['tasks']);

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
		case 'sales':
			return {
				label: __('Sales', 'doublescale'),
				description: isSalesDocumentsReady()
					? __(
							'Create proposals and invoices with line items, discounts, and customer billing.',
							'doublescale'
					  )
					: __(
							'Sales tools for your team. Includes the sales pipeline; proposals and invoices are coming soon.',
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

export type ChildModuleRow = {
	slug: string;
	label: string;
	description: string;
	/** Stored intent (`setting_enabled`) ignoring the parent gate; children default on. */
	settingEnabled: boolean;
	/** True when the sub-feature needs the Pro add-on to actually run. */
	unavailableUntilPro: boolean;
};

function childPlaceholderFor(slug: string): Pick<ModuleInfo, 'label' | 'description'> {
	if (slug === 'deals') {
		return {
			label: __('Pipeline', 'doublescale'),
			description: __(
				'Manage deals, stages, and pipeline analytics for your sales process.',
				'doublescale'
			),
		};
	}
	return { label: slug, description: '' };
}

/**
 * Nested toggle rows for a parent's card. The API row is present both with Pro
 * (real module) and without (phantom row persisted for upsell), so the label /
 * description / stored intent come from the payload whenever possible.
 */
export function buildChildModuleRows(
	parentSlug: string,
	modules: ModuleInfo[],
	isProAddonActive = false
): ChildModuleRow[] {
	return (CHILD_MODULES_BY_PARENT[parentSlug] ?? []).map((slug) => {
		const m = modules.find((x) => x.slug === slug);
		const placeholder = childPlaceholderFor(slug);
		return {
			slug,
			label: m?.label || placeholder.label,
			description: m?.description || placeholder.description,
			settingEnabled: m?.setting_enabled ?? true,
			unavailableUntilPro:
				PRO_ONLY_CHILD_MODULE_SLUGS.has(slug) && !isProAddonActive,
		};
	});
}

/** Displayed position of a child toggle: pending change wins over stored intent. */
export function getChildModuleToggleState(
	row: ChildModuleRow,
	pending: Record<string, boolean>
): boolean {
	return pending[row.slug] !== undefined ? pending[row.slug] : row.settingEnabled;
}

/**
 * Normalizes pending toggles: real modules when the user has not yet expressed
 * an explicit opinion (so first-run wizard always commits its defaults) or when
 * the value differs from the API; Pro placeholders only when turned on (visual
 * preference until Pro is installed). Child sub-features persist both
 * directions even without an API row — they default ON, so an explicit off is
 * as meaningful as an explicit on.
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
		} else if (CHILD_MODULE_SLUGS.has(s)) {
			out[s] = v;
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
