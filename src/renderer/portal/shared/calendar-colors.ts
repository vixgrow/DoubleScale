/**
 * Calendar event coloring — one source of truth, reused by the event chips and
 * the legend. Color is chosen by `kind` first, then refined by `status`, so a
 * paid invoice reads green while an overdue one reads red (mirrors the per-type
 * coloring of the reference CRM calendar).
 */

import type { PortalCalendarEventKind } from '../types';

export interface ChipTone {
	/** Solid chip (timed/booking events). */
	solid: string;
	/** Dot used for all-day doc markers. */
	dot: string;
}

const TONES: Record<string, ChipTone> = {
	blue: { solid: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
	amber: { solid: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
	green: { solid: 'bg-green-600 text-white', dot: 'bg-green-600' },
	red: { solid: 'bg-red-600 text-white', dot: 'bg-red-600' },
	muted: { solid: 'bg-gray-300 text-gray-700', dot: 'bg-gray-400' },
};

/**
 * Resolve the tone for an event from its kind + status.
 */
export const eventTone = (
	kind: PortalCalendarEventKind,
	status: string
): ChipTone => {
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

	return TONES.muted; // support / unknown
};
