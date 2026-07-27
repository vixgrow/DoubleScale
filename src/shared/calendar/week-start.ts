/**
 * Calendar week-start helpers shared by the month grid and useCalendar hook.
 *
 * date-fns uses 0 = Sunday … 6 = Saturday for `weekStartsOn`.
 */

import { __ } from '@wordpress/i18n';

export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const WEEKDAY_LABELS = [
	__( 'Sun', 'doublescale' ),
	__( 'Mon', 'doublescale' ),
	__( 'Tue', 'doublescale' ),
	__( 'Wed', 'doublescale' ),
	__( 'Thu', 'doublescale' ),
	__( 'Fri', 'doublescale' ),
	__( 'Sat', 'doublescale' ),
];

export const DEFAULT_WEEK_STARTS_ON: WeekStartsOn = 1;

export const normalizeWeekStartsOn = (value: unknown): WeekStartsOn => {
	const day = Number(value);
	if (Number.isInteger(day) && day >= 0 && day <= 6) {
		return day as WeekStartsOn;
	}
	return DEFAULT_WEEK_STARTS_ON;
};

/** Weekday headers ordered so the first column matches `weekStartsOn`. */
export const getWeekdayLabels = (weekStartsOn: WeekStartsOn): string[] => {
	const start = normalizeWeekStartsOn(weekStartsOn);
	return [
		...WEEKDAY_LABELS.slice(start),
		...WEEKDAY_LABELS.slice(0, start),
	];
};
