/**
 * Month grid — a 7-column day matrix with event chips per cell. Presentational and
 * bundle-agnostic: it receives the day cells + events and an optional `onSelect`
 * that it forwards to each chip (so the owning surface controls navigation).
 *
 * Events bucket by their **civil day** via {@link eventDayKey} (never a Date
 * comparison) so all-day markers and late-evening timed events land on the right
 * cell regardless of the viewer's offset.
 */

import { __, sprintf } from '@wordpress/i18n';
import { format, isSameMonth, isToday } from 'date-fns';

import type { CalendarEvent } from './types';
import { eventDayKey } from './dates';
import EventChip from './event-chip';
import {
	DEFAULT_WEEK_STARTS_ON,
	getWeekdayLabels,
	normalizeWeekStartsOn,
	type WeekStartsOn,
} from './week-start';

const MAX_PER_CELL = 3;

export interface MonthGridProps {
	/** All 35/42 day cells (including adjacent-month spill days). */
	days: Date[];
	/** The month the header names (1st of the visible month). */
	cursor: Date;
	events: CalendarEvent[];
	/** Forwarded to each chip; omit for a read-only (non-clickable) grid. */
	onSelect?: (event: CalendarEvent) => void;
	/** First column weekday (0 = Sunday … 6 = Saturday). Default Monday. */
	weekStartsOn?: WeekStartsOn | number;
}

const MonthGrid = ({
	days,
	cursor,
	events,
	onSelect,
	weekStartsOn = DEFAULT_WEEK_STARTS_ON,
}: MonthGridProps) => {
	const weekdayLabels = getWeekdayLabels(normalizeWeekStartsOn(weekStartsOn));

	// Bucket events by civil day once.
	const byDay = new Map<string, CalendarEvent[]>();
	for (const event of events) {
		const key = eventDayKey(event);
		const bucket = byDay.get(key);
		if (bucket) {
			bucket.push(event);
		} else {
			byDay.set(key, [event]);
		}
	}

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
			<div className="grid grid-cols-7 border-b border-border bg-muted/40">
				{weekdayLabels.map((label, index) => (
					<div
						key={`${label}-${index}`}
						className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
					>
						{label}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7">
				{days.map((day) => {
					const key = format(day, 'yyyy-MM-dd');
					const dayEvents = byDay.get(key) ?? [];
					const inMonth = isSameMonth(day, cursor);
					const today = isToday(day);
					const overflow = dayEvents.length - MAX_PER_CELL;

					return (
						<div
							key={key}
							className={`min-h-[6.5rem] border-b border-r border-border p-1.5 last:border-r-0 ${
								inMonth ? '' : 'bg-muted/30'
							}`}
						>
							<div className="mb-1 flex justify-end">
								<span
									className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
										today
											? 'bg-primary font-semibold text-primary-foreground'
											: inMonth
												? 'text-foreground'
												: 'text-muted-foreground'
									}`}
								>
									{format(day, 'd')}
								</span>
							</div>
							<div className="space-y-1">
								{dayEvents.slice(0, MAX_PER_CELL).map((event) => (
									<EventChip
										key={event.id}
										event={event}
										onSelect={onSelect}
									/>
								))}
								{overflow > 0 && (
									<p className="px-1 text-xs font-medium text-muted-foreground">
										{sprintf(
											// translators: %d is the number of additional events.
											__( '+%d more', 'doublescale' ),
											overflow
										)}
									</p>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default MonthGrid;
