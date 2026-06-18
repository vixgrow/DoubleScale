/**
 * Calendar date/time helpers shared by the grid and chips.
 *
 * The defining rule: event→day matching uses the event's **civil date**
 * (`YYYY-MM-DD`), never a `Date`-object comparison. An all-day invoice due on the
 * 1st must land on the 1st regardless of the viewer's UTC offset — a
 * `new Date('2026-06-01')` is midnight UTC and renders on May 31 for a behind-UTC
 * viewer (the classic all-day-shift bug). Timed events resolve their civil day in
 * the event's own tz so a late-evening booking doesn't slide to the next day.
 */

import type { CalendarEvent } from './types';

/**
 * Parse a stored value (SQL `Y-m-d H:i:s` is treated as UTC) into a Date, or null.
 */
const toDate = (value: string): Date | null => {
	if (!value) {
		return null;
	}
	const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * The civil `YYYY-MM-DD` an event belongs to.
 *
 * - All-day: the leading 10 chars of `start` (already a civil date) verbatim.
 * - Timed: the calendar day in the event's tz via Intl (en-CA → ISO-ish), so a
 *   late-evening event stays on its own day.
 */
export const eventDayKey = (event: CalendarEvent): string => {
	if (event.all_day || !event.start.includes(' ')) {
		return event.start.slice(0, 10);
	}
	const d = toDate(event.start);
	if (!d) {
		return event.start.slice(0, 10);
	}
	try {
		return new Intl.DateTimeFormat('en-CA', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			timeZone: event.timezone || 'UTC',
		}).format(d);
	} catch (e) {
		return event.start.slice(0, 10);
	}
};

/**
 * Short localized start time for a timed event, in the given tz. Empty string for
 * unparseable values (callers omit the time prefix then).
 */
export const formatEventTime = (value: string, timezone?: string): string => {
	const d = toDate(value);
	if (!d) {
		return '';
	}
	try {
		return new Intl.DateTimeFormat(undefined, {
			timeStyle: 'short',
			timeZone: timezone || 'UTC',
		}).format(d);
	} catch (e) {
		return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(d);
	}
};
