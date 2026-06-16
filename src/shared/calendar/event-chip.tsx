/**
 * A single calendar event pill. Timed events (bookings) render as a solid colored
 * chip with their start time; all-day markers render as a dot + label.
 *
 * Navigation is **injected**: the chip never knows whether it lives in the portal
 * (react-router relative routes) or the admin SPA (`getToLink` → `admin.php` URL).
 * The owning surface passes `onSelect`; the chip is clickable only when the event
 * has a `route` and a handler is supplied.
 */

import type { CalendarEvent } from './types';
import { eventTone } from './colors';
import { formatEventTime } from './dates';

export interface EventChipProps {
	event: CalendarEvent;
	/** Called when an actionable event is activated. The surface decides how to navigate. */
	onSelect?: (event: CalendarEvent) => void;
}

const EventChip = ({ event, onSelect }: EventChipProps) => {
	const tone = eventTone(event.kind, event.status);
	const clickable = !!event.route && !!onSelect;

	const onActivate = () => {
		if (event.route && onSelect) {
			onSelect(event);
		}
	};

	const baseCls =
		'block w-full truncate rounded px-1.5 py-0.5 text-left text-xs leading-tight transition-opacity';
	const interactive = clickable ? 'cursor-pointer hover:opacity-80' : '';

	if (event.all_day) {
		return (
			<button
				type="button"
				disabled={!clickable}
				onClick={onActivate}
				title={event.title}
				className={`${baseCls} ${interactive} flex items-center gap-1.5 bg-secondary text-secondary-foreground disabled:cursor-default`}
			>
				<span
					className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`}
					aria-hidden="true"
				/>
				<span className="truncate">{event.title}</span>
			</button>
		);
	}

	const time = formatEventTime(event.start, event.timezone || 'UTC');

	return (
		<button
			type="button"
			disabled={!clickable}
			onClick={onActivate}
			title={`${time ? `${time} · ` : ''}${event.title}`}
			className={`${baseCls} ${interactive} ${tone.solid} disabled:cursor-default`}
		>
			<span className="truncate">{event.title}</span>
		</button>
	);
};

export default EventChip;
