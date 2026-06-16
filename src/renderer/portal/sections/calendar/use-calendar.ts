/**
 * Calendar range + data state.
 *
 * Owns the visible month and fetches the feed for the **grid** window (which
 * spills into the trailing/leading days of the adjacent months the month view
 * renders), so events on those spill days show too. The server clamps the span
 * and owns the inclusive end-of-day bound, so we only ever pass `YYYY-MM-DD`.
 *
 * `date-fns` builds the day matrix; we never tz-shift the bound strings (they
 * are civil dates, formatted with the helpers in shared/format.ts at render).
 */

import { useCallback, useMemo, useState } from '@wordpress/element';
import {
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	startOfMonth,
	startOfWeek,
} from 'date-fns';

import { fetchCalendar, useAsync } from '../../api';

const ymd = (d: Date): string => format(d, 'yyyy-MM-dd');

export interface MonthGrid {
	/** The month the header names (1st of the visible month). */
	cursor: Date;
	/** All 35/42 day cells, including adjacent-month spill days. */
	days: Date[];
	/** Feed window bounds (YYYY-MM-DD) covering the whole grid. */
	rangeStart: string;
	rangeEnd: string;
}

/** Build the 6-week (Sun-start) grid for the month containing `cursor`. */
const buildGrid = (cursor: Date): MonthGrid => {
	const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
	const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
	return {
		cursor,
		days: eachDayOfInterval({ start: gridStart, end: gridEnd }),
		rangeStart: ymd(gridStart),
		rangeEnd: ymd(gridEnd),
	};
};

export const useCalendar = () => {
	const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));

	const grid = useMemo(() => buildGrid(cursor), [cursor]);

	const { data, loading, error } = useAsync(
		() => fetchCalendar(grid.rangeStart, grid.rangeEnd),
		[grid.rangeStart, grid.rangeEnd]
	);

	const goPrev = useCallback(() => setCursor((c) => addMonths(c, -1)), []);
	const goNext = useCallback(() => setCursor((c) => addMonths(c, 1)), []);
	const goToday = useCallback(() => setCursor(startOfMonth(new Date())), []);

	return {
		grid,
		events: data?.data ?? [],
		loading,
		error,
		goPrev,
		goNext,
		goToday,
	};
};
