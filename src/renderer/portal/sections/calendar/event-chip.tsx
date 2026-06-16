/**
 * A single calendar event pill. Timed events (bookings) render as a solid
 * colored chip with their start time; all-day doc markers render as a dot +
 * label. Clickable when the event carries a `route`.
 */

import { useNavigate } from 'react-router-dom';

import type { PortalCalendarEvent } from '../../types';
import { eventTone } from '../../shared/calendar-colors';
import { formatTime } from '../../shared/format';

const EventChip = ({ event }: { event: PortalCalendarEvent }) => {
	const navigate = useNavigate();
	const tone = eventTone(event.kind, event.status);
	const clickable = !!event.route;

	const onActivate = () => {
		if (event.route) {
			navigate(event.route);
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

	const time = formatTime(event.start, event.timezone || 'UTC');

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
