import dayjs from 'dayjs';
import { useState, useEffect, useMemo, useCallback } from 'react';
import './style.scss';
import isBetween from 'dayjs/plugin/isBetween';
import isToday from 'dayjs/plugin/isToday';
import { RendererEvent } from '@/types/booking';
import { Dayjs } from 'dayjs';
import PreviousIcon from '../../../../../icons/previous-icon';
import NextIcon from '../../../../../icons/next-icon';
import { css } from '@emotion/css';
import { Calendar } from '@/components/ui/calendar';
import type { DayButtonProps, MonthCaptionProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

dayjs.extend(isBetween);
dayjs.extend(isToday);

interface DatePickerProps {
	event: RendererEvent;
	selectedDate: Dayjs | null;
	setSelectedDate: (date: Dayjs | null) => void;
	timeZone: string;
	selectedAvailability?: any;
	setSelectedAvailability: (availability: any) => void;
	ajax_url: string;
	selectedDuration: number;
	setSelectedTime: (time: string | null) => void;
	baseColor: string;
	lightColor: string;
	setIsLoading: (isLoading: boolean) => void;
	setWaitingListEnabled?: (enabled: boolean) => void;
}

type BookingDayButtonProps = DayButtonProps & {
	baseColor: string;
	lightColor: string;
};

function BookingDayButton({
	day,
	modifiers,
	className,
	baseColor,
	lightColor,
	...buttonProps
}: BookingDayButtonProps) {
	const isSelected = modifiers.selected;
	const isAvailable = modifiers.available;
	const isTodayMarker = modifiers.today;
	const isDisabled = modifiers.disabled;

	const dayStyles = css`
		${isSelected
			? `
			background-color: ${baseColor} !important;
			color: #fff !important;
		`
			: isAvailable && !isDisabled
				? `
			background-color: ${lightColor} !important;
			color: #29292E !important;
		`
				: isDisabled
					? `
			color: #29292E !important;
			cursor: not-allowed !important;
			background: transparent !important;
		`
					: ''}
	`;

	return (
		<button
			type="button"
			className={cn(
				'calendar-date',
				isSelected && 'selected-date',
				isAvailable && !isDisabled && !isSelected && 'highlight-date',
				isTodayMarker && 'calendar-date--today',
				dayStyles,
				isDisabled && 'calendar-date--disabled',
				className
			)}
			{...buttonProps}
		>
			<div className="date-number">{day.date.getDate()}</div>
			{isTodayMarker && <div className="dot" />}
		</button>
	);
}

function BookingMonthCaption({
	calendarMonth,
	baseColor,
	lightColor,
	onPrevMonth,
	onNextMonth,
	nextDisabled,
}: MonthCaptionProps & {
	baseColor: string;
	lightColor: string;
	onPrevMonth: () => void;
	onNextMonth: () => void;
	nextDisabled: boolean;
}) {
	const navBtnClass = css`
		background-color: ${lightColor};
		color: ${baseColor};
	`;

	return (
		<div className="calendar-header">
			<button
				type="button"
				onClick={onPrevMonth}
				className={cn('nav-arrow', navBtnClass)}
			>
				<PreviousIcon />
			</button>
			<div className="month-label">
				{dayjs(calendarMonth.date).format('MMMM YYYY')}
			</div>
			<button
				type="button"
				onClick={onNextMonth}
				disabled={nextDisabled}
				className={cn('nav-arrow', navBtnClass)}
				style={
					nextDisabled
						? { opacity: 0.5, cursor: 'not-allowed' }
						: undefined
				}
			>
				<NextIcon />
			</button>
		</div>
	);
}

const DatePicker: React.FC<DatePickerProps> = ({
	event,
	selectedDate,
	setSelectedDate,
	timeZone,
	selectedAvailability,
	setSelectedAvailability,
	ajax_url,
	selectedDuration,
	setSelectedTime,
	baseColor,
	lightColor,
	setIsLoading,
	setWaitingListEnabled,
}) => {
	const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
	const [loadedMonths, setLoadedMonths] = useState<string[]>([]);
	const [reachedEndDate, setReachedEndDate] = useState<boolean>(false);

	useEffect(() => {
		if (selectedDate) {
			setCurrentMonth(selectedDate);
		}
	}, [selectedDate]);

	useEffect(() => {
		setIsLoading(true);
	}, []);

	const fetchAvailability = async (date: Dayjs, calendar_id?: number) => {
		const formData = new FormData();
		formData.append('action', 'doublescale_booking_booking_slots');
		formData.append('nonce', (window as any)['doublescale_booking_config']?.nonce || '');
		formData.append('id', event.id.toString());
		formData.append('timezone', timeZone || '');
		formData.append('start_date', date.format('YYYY-MM-DD HH:mm:ss'));
		formData.append('duration', selectedDuration.toString());

		if (calendar_id) {
			formData.append('calendar_id', calendar_id.toString());
		}

		try {
			const response = await fetch(ajax_url, {
				method: 'POST',
				body: formData,
			});
			if (response.ok) {
				const data = await response.json();
				if (data && data.success && data.data && data.data.slots) {
					setSelectedAvailability((prevAvailability: any) => ({
						...prevAvailability,
						...data.data.slots,
					}));
					if (data.data.waiting_list_enabled && setWaitingListEnabled) {
						setWaitingListEnabled(true);
					}
					setLoadedMonths((prev) => [
						...prev,
						date.format('YYYY-MM'),
					]);
					setIsLoading(false);
					setReachedEndDate(false);
				} else {
					setIsLoading(false);
					if (
						data &&
						!data.success &&
						data.data &&
						data.data.message === 'Event is not available'
					) {
						setReachedEndDate(true);
					} else {
						console.error('Invalid slots data received:', data);
						console.error(
							'start_date:',
							date.format('YYYY-MM-DD HH:mm:ss')
						);
					}
				}
			} else {
				console.error(
					'Error fetching availability: Server returned',
					response.status
				);
				setIsLoading(false);
			}
		} catch (error) {
			console.error('Error fetching availability:', error);
			setIsLoading(false);
		}
	};

	useEffect(() => {
		setLoadedMonths([]);
		setSelectedAvailability({});
		setReachedEndDate(false);

		fetchAvailability(dayjs(), event.calendar_id);
		setSelectedDate(null);
		setSelectedTime(null);
	}, [timeZone, selectedDuration]);

	useEffect(() => {
		const monthKey = currentMonth.format('YYYY-MM');
		if (!loadedMonths.includes(monthKey) && !reachedEndDate) {
			fetchAvailability(currentMonth, event.calendar_id);
		}
	}, [currentMonth]);

	const isDateAvailable = useCallback(
		(date: Date) => {
			if (!selectedAvailability) {
				return false;
			}
			return (
				selectedAvailability[dayjs(date).format('YYYY-MM-DD')] !==
				undefined
			);
		},
		[selectedAvailability]
	);

	const isDateDisabled = useCallback(
		(date: Date) => {
			const current = dayjs(date);
			if (current.isBefore(dayjs(), 'day')) {
				return true;
			}
			if (!selectedAvailability) {
				return true;
			}
			return (
				selectedAvailability[current.format('YYYY-MM-DD')] === undefined
			);
		},
		[selectedAvailability]
	);

	const DayButtonComponent = useMemo(
		() =>
			function DayBtn(props: DayButtonProps) {
				return (
					<BookingDayButton
						{...props}
						baseColor={baseColor}
						lightColor={lightColor}
					/>
				);
			},
		[baseColor, lightColor]
	);

	const handlePrevMonth = () => {
		setCurrentMonth((prev) => prev.subtract(1, 'month'));
		setReachedEndDate(false);
	};

	const handleNextMonth = () => {
		if (!reachedEndDate) {
			setCurrentMonth((prev) => prev.add(1, 'month'));
		}
	};

	const MonthCaptionComponent = useMemo(
		() =>
			function Caption(props: MonthCaptionProps) {
				return (
					<BookingMonthCaption
						{...props}
						baseColor={baseColor}
						lightColor={lightColor}
						onPrevMonth={handlePrevMonth}
						onNextMonth={handleNextMonth}
						nextDisabled={reachedEndDate}
					/>
				);
			},
		[baseColor, lightColor, reachedEndDate]
	);

	return (
		<Calendar
			mode="single"
			required
			showOutsideDays
			fixedWeeks
			className="custom-calendar"
			style={
				{
					'--booking-primary-color': baseColor,
				} as React.CSSProperties
			}
			month={currentMonth.toDate()}
			onMonthChange={(month) => {
				if (month) {
					setCurrentMonth(dayjs(month));
				}
			}}
			selected={selectedDate?.toDate()}
			onSelect={(date) => {
				if (!date) {
					return;
				}
				const next = dayjs(date).startOf('day');
				setSelectedDate(next);
				setCurrentMonth(next);
			}}
			disabled={isDateDisabled}
			modifiers={{
				available: (date) =>
					isDateAvailable(date) && !isDateDisabled(date),
				today: (date) => dayjs(date).isToday(),
			}}
			classNames={{
				root: 'custom-calendar-root',
				months: 'custom-calendar-months',
				month: 'custom-calendar-month',
				month_caption: 'custom-calendar-caption',
				nav: 'hidden',
				month_grid: 'custom-calendar-grid',
				weekdays: 'custom-calendar-weekdays',
				weekday: 'custom-calendar-weekday',
				week: 'custom-calendar-week',
				day: 'custom-calendar-day',
				disabled: 'custom-calendar-day-disabled',
				outside: 'custom-calendar-day-outside',
				today: 'custom-calendar-day-today',
				selected: 'custom-calendar-day-selected',
			}}
			components={{
				MonthCaption: MonthCaptionComponent,
				DayButton: DayButtonComponent,
				Chevron: () => <span />,
			}}
		/>
	);
};

export default DatePicker;
