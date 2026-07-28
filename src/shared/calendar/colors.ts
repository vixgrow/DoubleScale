/**
 * Calendar event coloring — one source of truth, reused by the event chips and
 * the kind legend on both the portal and admin calendars. Color is chosen by
 * `kind` first, then refined by `status`, so a paid invoice reads green while an
 * overdue one reads red (mirrors the per-type coloring of the reference CRM
 * calendar).
 *
 * This is the superset version: the original portal kinds (booking/invoice/
 * proposal/support) plus the admin-only kinds (task/deal/contract).
 *
 * Default (non-status) colors are unique per kind so the legend never collides:
 * booking blue · proposal indigo · invoice amber · contract rose · task violet · deal teal.
 */

import type { CalendarEventKind } from './types';

export interface ChipTone {
	/** Solid chip (timed/booking events). */
	solid: string;
	/** Dot used for all-day markers / legend swatches. */
	dot: string;
}

const TONES: Record<string, ChipTone> = {
	blue: { solid: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
	indigo: { solid: 'bg-indigo-500 text-white', dot: 'bg-indigo-500' },
	amber: { solid: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
	rose: { solid: 'bg-rose-500 text-white', dot: 'bg-rose-500' },
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
		return TONES.indigo; // open / sent
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
		return TONES.rose; // sent / draft-ish
	}

	return TONES.muted; // support / unknown
};

/**
 * Default legend tone for a kind (ignores status) — used by the category
 * filter chips so each label shows a stable, unique color swatch.
 */
export const kindTone = (kind: CalendarEventKind): ChipTone => {
	switch (kind) {
		case 'booking':
			return TONES.blue;
		case 'proposal':
			return TONES.indigo;
		case 'invoice':
			return TONES.amber;
		case 'contract':
			return TONES.rose;
		case 'task':
			return TONES.violet;
		case 'deal':
			return TONES.teal;
		default:
			return TONES.muted;
	}
};
