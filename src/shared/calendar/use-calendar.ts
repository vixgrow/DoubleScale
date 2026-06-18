/**
 * Calendar range + data state, shared by both calendar surfaces.
 *
 * Owns the visible month and fetches the feed for the **grid** window (which spills
 * into the trailing/leading days of the adjacent months the month view renders), so
 * events on those spill days show too. The server clamps the span and owns the
 * inclusive end-of-day bound, so we only ever pass `YYYY-MM-DD`.
 *
 * The data source is **injected** (`fetcher`) so the portal can pass its
 * contact-scoped `fetchCalendar` and the admin SPA its role-scoped
 * `fetchAdminCalendar`. `extraDeps` lets a caller (the admin assignee filter)
 * force a refetch on inputs beyond the date window. Async state is owned here —
 * no dependency on either bundle's data layer.
 */

import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	startOfMonth,
	startOfWeek,
} from 'date-fns';

import type { CalendarEvent, CalendarFeedResponse } from './types';

const ymd = (d: Date): string => format(d, 'yyyy-MM-dd');

export interface CalendarGrid {
	/** The month the header names (1st of the visible month). */
	cursor: Date;
	/** All 35/42 day cells, including adjacent-month spill days. */
	days: Date[];
	/** Feed window bounds (YYYY-MM-DD) covering the whole grid. */
	rangeStart: string;
	rangeEnd: string;
}

/** Build the 6-week (Sun-start) grid for the month containing `cursor`. */
const buildGrid = (cursor: Date): CalendarGrid => {
	const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
	const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
	return {
		cursor,
		days: eachDayOfInterval({ start: gridStart, end: gridEnd }),
		rangeStart: ymd(gridStart),
		rangeEnd: ymd(gridEnd),
	};
};

const errorMessage = (err: unknown): string => {
	const e = err as { message?: string };
	if (typeof e?.message === 'string' && e.message.trim()) {
		return e.message.trim();
	}
	return __( 'Something went wrong. Please try again.', 'doublescale' );
};

export type CalendarFetcher = (
	start: string,
	end: string
) => Promise<CalendarFeedResponse>;

export interface UseCalendarResult {
	grid: CalendarGrid;
	events: CalendarEvent[];
	loading: boolean;
	error: string | null;
	goPrev: () => void;
	goNext: () => void;
	goToday: () => void;
	refetch: () => void;
}

export const useCalendar = (
	fetcher: CalendarFetcher,
	extraDeps: unknown[] = []
): UseCalendarResult => {
	const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
	const grid = useMemo(() => buildGrid(cursor), [cursor]);

	const [data, setData] = useState<CalendarFeedResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		fetcher(grid.rangeStart, grid.rangeEnd)
			.then((res) => {
				if (!cancelled) {
					setData(res);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setError(errorMessage(err));
				}
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [grid.rangeStart, grid.rangeEnd, reloadKey, ...extraDeps]);

	const goPrev = useCallback(() => setCursor((c) => addMonths(c, -1)), []);
	const goNext = useCallback(() => setCursor((c) => addMonths(c, 1)), []);
	const goToday = useCallback(() => setCursor(startOfMonth(new Date())), []);
	const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

	return {
		grid,
		events: data?.data ?? [],
		loading,
		error,
		goPrev,
		goNext,
		goToday,
		refetch,
	};
};
