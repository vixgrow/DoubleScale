/**
 * Shared calendar event model — the foundation type both calendar surfaces speak:
 * the customer Client Portal calendar (`src/renderer/portal`) and the admin/staff
 * calendar (`src/client/pages/calendar`).
 *
 * It is a **superset**: the portal feed emits only `booking`/`invoice`/`proposal`
 * (and never the staff-facing `assignee`/`contact` extras); the admin feed adds
 * `task`/`deal`/`contract` and the staff extras. Optional fields keep both feeds
 * type-valid without separate models — the renderer simply ignores extras it never
 * receives, and `colors.ts` covers every kind.
 */

export type CalendarEventKind =
	| 'booking'
	| 'invoice'
	| 'proposal'
	| 'support'
	| 'task'
	| 'deal'
	| 'contract';

/** A staff member or contact attached to an event (admin feed only). */
export interface CalendarEventParty {
	id: number;
	name: string;
}

export interface CalendarEvent {
	id: string;
	kind: CalendarEventKind;
	title: string;
	/** Event date(time). All-day events carry a `YYYY-MM-DD`; timed ones a datetime. */
	start: string;
	end: string | null;
	all_day: boolean;
	/** Render tz for timed events (site tz on admin, booking tz on portal); null for all-day. */
	timezone: string | null;
	status: string;
	/**
	 * Navigation target; null when not actionable. The convention differs by feed:
	 * the admin feed emits a slugless path for `getToLink` (e.g. `sales/invoices/12`),
	 * the portal feed a root-relative react-router path (e.g. `/bookings/12`). The
	 * shared grid/chip never navigate themselves — they forward to each surface's
	 * `onSelect`, which applies the right router — so the two conventions don't clash.
	 */
	route: string | null;
	/** Owner shown in the admin assignee filter/label. Absent on the portal feed. */
	assignee?: CalendarEventParty | null;
	/** Related contact, when applicable. Absent on the portal feed. */
	contact?: CalendarEventParty | null;
}

export interface CalendarFeedResponse {
	data: CalendarEvent[];
}
