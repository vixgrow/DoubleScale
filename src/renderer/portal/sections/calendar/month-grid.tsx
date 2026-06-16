/**
 * Month grid — a 7-column day matrix with event chips per cell.
 *
 * Event→day matching uses the event's **civil date** (`YYYY-MM-DD`), never a
 * `Date`-object comparison: an all-day invoice due on the 1st must land on the
 * 1st regardless of the viewer's offset (a `new Date('2026-06-01')` is midnight
 * UTC and renders on May 31 for a behind-UTC viewer — exactly the bug §8 warns
 * about). For timed bookings we take the local civil day in the booking's tz so
 * a late-evening booking doesn't slide to the next day.
 */

import { __, sprintf } from '@wordpress/i18n';
import { format, isSameMonth, isToday } from 'date-fns';

import type { PortalCalendarEvent } from '../../types';
import EventChip from './event-chip';

const MAX_PER_CELL = 3;

const WEEKDAYS = [
	__( 'Sun', 'doublescale' ),
	__( 'Mon', 'doublescale' ),
	__( 'Tue', 'doublescale' ),
	__( 'Wed', 'doublescale' ),
	__( 'Thu', 'doublescale' ),
	__( 'Fri', 'doublescale' ),
	__( 'Sat', 'doublescale' ),
];

/**
 * The civil `YYYY-MM-DD` an event belongs to.
 *
 * - All-day: the leading 10 chars of `start` (already a civil date) verbatim.
 * - Timed: the calendar day in the event's tz via Intl (en-CA → ISO-ish).
 */
const eventDayKey = (event: PortalCalendarEvent): string => {
	if (event.all_day || !event.start.includes(' ')) {
		return event.start.slice(0, 10);
	}
	// Timed booking: stored UTC; resolve the civil day in its own tz.
	const iso = `${event.start.replace(' ', 'T')}Z`;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) {
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

const MonthGrid = ({
	days,
	cursor,
	events,
}: {
	days: Date[];
	cursor: Date;
	events: PortalCalendarEvent[];
}) => {
	// Bucket events by civil day once.
	const byDay = new Map<string, PortalCalendarEvent[]>();
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
				{WEEKDAYS.map((label) => (
					<div
						key={label}
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
									<EventChip key={event.id} event={event} />
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
