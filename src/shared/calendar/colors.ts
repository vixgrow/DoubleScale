/**
 * Calendar event coloring — one source of truth, reused by the event chips and
 * (later) the legend on both the portal and admin calendars. Color is chosen by
 * `kind` first, then refined by `status`, so a paid invoice reads green while an
 * overdue one reads red (mirrors the per-type coloring of the reference CRM
 * calendar).
 *
 * This is the superset version: the original portal kinds (booking/invoice/
 * proposal/support) plus the admin-only kinds (task/deal/contract).
 */

import type { CalendarEventKind } from './types';

export interface ChipTone {
	/** Solid chip (timed/booking events). */
	solid: string;
	/** Dot used for all-day markers. */
	dot: string;
}

const TONES: Record<string, ChipTone> = {
	blue: { solid: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
	amber: { solid: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
	green: { solid: 'bg-green-600 text-white', dot: 'bg-green-600' },
	red: { solid: 'bg-red-600 text-white', dot: 'bg-red-600' },
	violet: { solid: 'bg-violet-500 text-white', dot: 'bg-violet-500' },
	teal: { solid: 'bg-teal-500 text-white', dot: 'bg-teal-500' },
	muted: { solid: 'bg-gray-300 text-gray-700', dot: 'bg-gray-400' },
};

/**
 * Resolve the tone for an event from its kind + status.
 */
export const eventTone = (kind: CalendarEventKind, status: string): ChipTone => {
	const s = (status || '').toLowerCase();

	if (kind === 'booking') {
		if (s === 'cancelled' || s === 'rejected') {
			return TONES.muted;
		}
		if (s === 'pending' || s === 'waiting') {
			return TONES.amber;
		}
		return TONES.blue;
	}

	if (kind === 'invoice') {
		if (s === 'overdue') {
			return TONES.red;
		}
		if (s === 'paid') {
			return TONES.green;
		}
		return TONES.amber; // unpaid / partially_paid
	}

	if (kind === 'proposal') {
		if (s === 'accepted') {
			return TONES.green;
		}
		if (s === 'declined' || s === 'expired') {
			return TONES.muted;
		}
		return TONES.blue; // open / sent
	}

	if (kind === 'task') {
		if (s === 'completed' || s === 'done') {
			return TONES.green;
		}
		if (s === 'overdue') {
			return TONES.red;
		}
		return TONES.violet; // open / in_progress
	}

	if (kind === 'deal') {
		if (s === 'won') {
			return TONES.green;
		}
		if (s === 'lost') {
			return TONES.muted;
		}
		return TONES.teal; // open pipeline
	}

	if (kind === 'contract') {
		if (s === 'expired') {
			return TONES.red;
		}
		if (s === 'signed' || s === 'active') {
			return TONES.green;
		}
		return TONES.amber; // sent / draft-ish
	}

	return TONES.muted; // support / unknown
};
