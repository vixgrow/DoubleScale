/**
 * Provider list for "Connect to remote calendars".
 *
 * Kept free of React/icons so the slug contract can be unit-tested without
 * loading the admin page (OAuth return URLs and stale bookmarks depend on it).
 */
import { __ } from '@wordpress/i18n';

export type CalendarIntegrationSlug = 'google' | 'zoom' | 'apple' | 'outlook';

export const SLUG_ORDER: CalendarIntegrationSlug[] = [
	'google',
	'zoom',
	'apple',
	'outlook',
];

export type ProviderCopy = {
	name: string;
	description: string;
};

/**
 * A provider slug is only honoured when it is one we render. Anything else
 * (a stale bookmark, a hand-edited URL) is rejected so the page can fall
 * back to Google rather than rendering an empty panel.
 */
export const normalizeProviderSlug = (
	value: string | null | undefined
): CalendarIntegrationSlug | null =>
	value && (SLUG_ORDER as string[]).includes(value)
		? (value as CalendarIntegrationSlug)
		: null;

/**
 * Opening "Connect to remote calendars" always lands on a real panel. Google
 * is first in the list and the usual OAuth path, so missing or unknown
 * `provider` query values resolve here instead of a chooser screen.
 */
export const DEFAULT_PROVIDER_SLUG: CalendarIntegrationSlug = 'google';

export const resolveProviderSlug = (
	value: string | null | undefined
): CalendarIntegrationSlug =>
	normalizeProviderSlug(value) ?? DEFAULT_PROVIDER_SLUG;

export const fallbackProviderCopy = (
	slug: CalendarIntegrationSlug
): ProviderCopy => {
	const names: Record<CalendarIntegrationSlug, string> = {
		google: __('Google Calendar / Meet', 'doublescale'),
		zoom: __('Zoom', 'doublescale'),
		apple: __('Apple Calendar', 'doublescale'),
		outlook: __('Outlook / Microsoft 365', 'doublescale'),
	};
	const descriptions: Record<CalendarIntegrationSlug, string> = {
		google: __(
			'Sync availability and add bookings to Google Calendar.',
			'doublescale'
		),
		zoom: __('Create Zoom meetings when events are booked.', 'doublescale'),
		apple: __(
			'Sync with Apple Calendar using a secure app password.',
			'doublescale'
		),
		outlook: __(
			'Sync with Outlook and optional Microsoft Teams.',
			'doublescale'
		),
	};
	return { name: names[slug], description: descriptions[slug] };
};

/**
 * Prefer server-injected labels when present (stale option cache otherwise
 * falls back to bundled copy so the list never goes blank).
 */
export const resolveProviderCopy = (
	slug: CalendarIntegrationSlug,
	cfg?: { name?: string; description?: string } | null
): ProviderCopy => {
	const fallback = fallbackProviderCopy(slug);
	return {
		name: cfg?.name || fallback.name,
		description: cfg?.description || fallback.description,
	};
};
