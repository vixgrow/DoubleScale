import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { __ } from '@wordpress/i18n';
import { RendererEvent, EventTypes } from '@/types/booking';
import './style.scss';
import { css } from '@emotion/css';
import InfoIcon from '../../../../../icons/info-icon';
import { doAction, applyFilters } from '@wordpress/hooks';

dayjs.extend(customParseFormat);

const getSlotTime = (start: string): string => {
	if (!start) {
		return '';
	}
	if (start.includes('T')) {
		const parsed = dayjs(start);
		return parsed.isValid() ? parsed.format('HH:mm') : '';
	}
	const timeString = start.split(' ')[1];
	if (!timeString) {
		return '';
	}
	const [hours, minutes] = timeString.split(':');
	return `${hours}:${minutes}`;
};

interface TimeSlot {
	time: string;
	remaining: number;
	hosts_ids: number[];
	waiting_list_count?: number;
	originalSlot: {
		start: string;
		end: string;
		remaining: number;
		hosts_ids: number[];
	};
}

interface TimePickerProps {
	selectedAvailability: Record<string, unknown> | null;
	selectedDate: Dayjs;
	selectedTime: string | null;
	setSelectedTime: (time: string) => void;
	setHostIds: (hostIds: number[]) => void;
	eventType?: EventTypes;
	showRemaining?: boolean;
	baseColor: string;
	lightColor: string;
	event: RendererEvent;
	timeFormat: string;
	waitingListEnabled?: boolean;
	onWaitingListSlotSelected?: (isWaitingList: boolean) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({
	selectedAvailability,
	selectedDate,
	selectedTime,
	setSelectedTime,
	setHostIds,
	eventType = 'one-to-one',
	showRemaining,
	baseColor,
	lightColor,
	event,
	timeFormat,
	waitingListEnabled = false,
	onWaitingListSlotSelected,
}) => {
	const formatTimeDisplay = (time: string) => {
		const displayFormat = timeFormat === '24' ? 'HH:mm' : 'hh:mm A';
		const parsed = dayjs(time, ['HH:mm', 'H:mm', 'HH:mm:ss'], true);
		if (!parsed.isValid()) {
			return time;
		}
		return parsed.format(displayFormat);
	};

	const getTimeSlots = (): TimeSlot[] => {
		if (!selectedAvailability) {
			return [];
		}

		const dateKey = selectedDate.format('YYYY-MM-DD');
		const slotsForDate = selectedAvailability[dateKey];

		if (!slotsForDate || !Array.isArray(slotsForDate)) {
			return [];
		}

		const showFullSlots = applyFilters(
			'doublescale_booking_renderer_show_full_slots',
			false,
			waitingListEnabled
		) as boolean;

		return slotsForDate
			.filter(
				(slot: {
					remaining: number;
					waiting_list_count?: number;
					waiting_list_capacity?: number;
				}) => {
					if (!slot) return false;
					if (slot.remaining > 0) return true;
					if (!showFullSlots) return false;
					if (
						slot.waiting_list_capacity !== undefined &&
						slot.waiting_list_count !== undefined &&
						slot.waiting_list_count >= slot.waiting_list_capacity
					) {
						return false;
					}
					return true;
				}
			)
			.flatMap(
				(slot: {
					start: string;
					end: string;
					remaining: number;
					hosts_ids: number[];
					waiting_list_count?: number;
				}): TimeSlot[] => {
					if (!slot || !slot.start) {
						return [];
					}
					const time = getSlotTime(slot.start);
					if (!time) {
						return [];
					}
					return [
						{
							time,
							remaining: slot.remaining,
							hosts_ids: slot.hosts_ids,
							waiting_list_count: slot.waiting_list_count,
							originalSlot: slot,
						},
					];
				}
			);
	};

	const timeSlots = getTimeSlots();
	const isGroupEvent = eventType === 'group';

	const formatSpotsBadge = (spots: number) => {
		if (spots === 1) {
			return (
				<span className="time-slot-spots time-slot-spots-single">
					<span>
						<InfoIcon />
					</span>
					<span>1</span>
					<span>{__('last spot', 'doublescale')}</span>
				</span>
			);
		} else if (spots < 5) {
			return (
				<span className="time-slot-spots time-slot-spots-few">
					<span>
						<InfoIcon />
					</span>
					<span>{spots}</span>
					<span>{__('spots left', 'doublescale')}</span>
				</span>
			);
		} else {
			return (
				<span className="time-slot-spots">
					<span>
						<InfoIcon />
					</span>
					<span>{spots}</span>
					<span>{__('spots available', 'doublescale')}</span>
				</span>
			);
		}
	};

	return (
		<div
			className={`time-picker-container ${css`
				scrollbar-color: ${baseColor} #f5f5f5;
				&::-webkit-scrollbar-thumb {
					background: ${baseColor};
					border-radius: 8px;
				}
			`}`}
		>
			<p className="time-picker-title">
				{selectedDate.format('dddd, MMMM D')}
			</p>
			<div className="time-slots-container">
				{timeSlots.length > 0 ? (
					timeSlots.map((slot: TimeSlot, index: number) => (
						<div
							key={index}
							className={`time-slot ${isGroupEvent ? 'group-event-container' : (waitingListEnabled && slot.remaining === 0) ? 'time-slot-waiting' : 'time-slot-centered'} ${selectedTime === slot.time ? 'active' : ''} ${css`
								&:hover {
									background-color: ${lightColor};
									color: ${baseColor};
									border-color: ${baseColor};
								}
							`}`}
							onClick={() => {
								setSelectedTime(slot.time);
								setHostIds(slot.hosts_ids);
								onWaitingListSlotSelected?.(
									waitingListEnabled && slot.remaining === 0
								);
								doAction('DoubleScale.BookingStarted', {
									data: {
										calendar_id: event.calendar_id,
										event_id: event.id,
									},
								});
							}}
						>
							<span className="time-slot-time">
								{formatTimeDisplay(slot.time)}
							</span>
							{applyFilters(
								'doublescale_booking_renderer_time_slot_badge',
								null,
								slot,
								waitingListEnabled
							) as React.ReactNode}
							{isGroupEvent &&
								showRemaining &&
								slot.remaining > 0 &&
								formatSpotsBadge(slot.remaining)}
						</div>
					))
				) : (
					<div className="no-time-slots">
						{__(
							'No available time slots for this day',
							'doublescale'
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default TimePicker;
