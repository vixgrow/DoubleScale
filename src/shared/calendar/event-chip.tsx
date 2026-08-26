/**
 * A single calendar event pill. Timed events (bookings) render as a solid colored
 * chip with their start time; all-day markers use the same solid kind/status tone
 * so labels stay readable (white on a saturated color).
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
		'block w-full truncate rounded-lg px-2 py-1 text-left text-xs font-medium leading-tight transition-opacity';
	const interactive = clickable
		? 'cursor-pointer hover:opacity-90'
		: 'cursor-default';

	if (event.all_day) {
		return (
			<button
				type="button"
				disabled={!clickable}
				onClick={onActivate}
				title={event.title}
				className={`${baseCls} ${interactive} flex items-center gap-1.5 ${tone.solid} disabled:cursor-default disabled:opacity-100`}
			>
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
			className={`${baseCls} ${interactive} ${tone.solid} disabled:cursor-default disabled:opacity-100`}
		>
			<span className="truncate">{event.title}</span>
		</button>
	);
};

export default EventChip;
