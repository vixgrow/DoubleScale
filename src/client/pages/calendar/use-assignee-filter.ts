/**
 * Manager-only "view as assignee" helpers for the admin calendar.
 *
 * `isCalendarManager()` decides whether the assignee control is shown at all — a
 * staff member who manages all of at least one contributing module (CRM / Sales /
 * Booking manager). Reps never see it, and the server ignores `view_user` for them
 * regardless, so this gate is purely UX (no security depends on it).
 *
 * `useStafferRoster()` derives the dropdown's staffer list from the assignees
 * present in the **All** feed, so Phase 1 needs no separate users endpoint: it
 * accumulates while we're viewing All (`active`) and keeps the roster stable while
 * a single staffer is selected (so the dropdown doesn't collapse to one entry).
 */

import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import Config from '@doublescale/config';

import type { CalendarEvent } from '@doublescale/shared/calendar';

/** `view_user` value meaning "no single-staffer scope" (all for managers). */
export const ASSIGNEE_ALL = 0;

export interface Staffer {
	id: number;
	name: string;
}

/**
 * Whether the current user manages all records in at least one contributing module
 * (and so may scope the calendar to other staffers).
 */
export const isCalendarManager = (): boolean => {
	const caps = Config.getUserCapabilities();
	return Boolean(
		caps.doublescale_crm_manager ||
			caps.doublescale_sales_manager ||
			caps.doublescale_booking_manager
	);
};

/**
 * Accumulate a stable, sorted staffer roster from event assignees.
 *
 * @param events Current feed events.
 * @param active Collect only while true (i.e. while viewing All); keep roster otherwise.
 */
export const useStafferRoster = (
	events: CalendarEvent[],
	active: boolean
): Staffer[] => {
	const rosterRef = useRef<Map<number, string>>(new Map());
	const [version, setVersion] = useState(0);

	useEffect(() => {
		if (!active) {
			return;
		}
		let changed = false;
		for (const event of events) {
			const a = event.assignee;
			if (a && a.id > 0 && !rosterRef.current.has(a.id)) {
				rosterRef.current.set(a.id, a.name || `#${a.id}`);
				changed = true;
			}
		}
		if (changed) {
			setVersion((v) => v + 1);
		}
	}, [events, active]);

	return useMemo(
		() =>
			Array.from(rosterRef.current.entries())
				.map(([id, name]) => ({ id, name }))
				.sort((a, b) => a.name.localeCompare(b.name)),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[version]
	);
};
