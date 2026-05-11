/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useParams, useNavigate, getToLink } from '@doublescale/navigation';

import { useApi } from '@/hooks/booking';
import type { Booking, NoticeMessage } from '@/types/booking';
import {
	convertTimezone,
	getCurrentTimezone,
	groupBookingsByDate,
	formatTime,
} from '@/utils/booking';
import AddBookingModal from '@/components/booking/add-booking-modal';
import BookingList from './booking-list';
import MeetingInformation from './meeting-information';
import InviteeInformation from './invitee-information';
import MeetingActivities from './booking-activities';
import {
	CancelIcon,
	UpcomingCalendarIcon,
	NoticeBanner,
} from '@/components/booking';
import { BookingActions } from '@/components/booking';
import BookingQuestion from './booking-question';
import PaymentHistory from './payment-history';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface DayInfo {
	weekday: string;
	dayOfMonth: string;
	month: number;
	year: number;
}

function getNextTenDays(): DayInfo[] {
	const days: DayInfo[] = [];
	for (let i = 0; i < 10; i++) {
		const date = new Date();
		date.setDate(date.getDate() + i);
		days.push({
			weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
			dayOfMonth: date.getDate().toString().padStart(2, '0'),
			month: date.getMonth() + 1,
			year: date.getFullYear(),
		});
	}
	return days;
}

const days = getNextTenDays();

const ShimmerLoader = () => (
	<div className="p-16 pt-8 animate-pulse">
		{/* Header */}
		<div className="flex justify-between border-b border-[#E5E5E5] pb-7 mb-10">
			<div className="h-8 w-48 bg-gray-200 rounded-md" />
			<div className="h-8 w-32 bg-gray-200 rounded-md" />
		</div>

		{/* Main Flex Row */}
		<div className="flex gap-8">
			{/* Left Column: 4 Cards (2/3 width) */}
			<div className="w-2/3 flex flex-col gap-6">
				{Array.from({ length: 4 }).map((_, index) => (
					<div
						key={index}
						className="bg-white shadow border border-gray-200 rounded-xl p-6"
					>
						<div className="h-5 w-1/3 bg-gray-200 rounded" />
						<div className="mt-4 h-4 w-2/3 bg-gray-200 rounded" />
						<div className="mt-2 h-4 w-1/2 bg-gray-200 rounded" />
					</div>
				))}
			</div>

			{/* Right Column: 3 Cards (1/3 width) */}
			<div className="w-1/3 flex flex-col gap-6">
				{Array.from({ length: 3 }).map((_, index) => (
					<div
						key={index}
						className="bg-white shadow border border-gray-200 rounded-xl p-6"
					>
						<div className="h-5 w-1/2 bg-gray-200 rounded" />
						<div className="mt-4 h-4 w-3/4 bg-gray-200 rounded" />
						<div className="mt-2 h-4 w-full bg-gray-200 rounded" />
					</div>
				))}
			</div>
		</div>
	</div>
);

const BookingDetails: React.FC = () => {
	// Destructure params at the top.
	const { id: bookingIdParam } = useParams<{
		id: string;
		period: string;
	}>();

	const [booking, setBooking] = useState<Booking | null>(null);
	const [open, setOpen] = useState<boolean>(false);
	const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
	const [refresh, setRefresh] = useState(false);
	const [selectedDate, setSelectedDate] = useState<number>(0);
	const [bookingId, setBookingId] = useState<string | number>(
		bookingIdParam || ''
	);
	const [isLoading, setIsLoading] = useState(true);

	const { callApi } = useApi();
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(true);
	const [timeFormat, setTimeFormat] = useState<string>('12'); // Default to 24-hour format

	const handleStatusUpdated = (action?: string) => {
		switch (action) {
			case 'delete':
				handleClose();
				break;
			case 'rebook':
				if (!open) {
					// Only open if not already open
					setOpen(true);
				}
				break;
			default:
				// For other actions like mark_as_completed, just refresh the data
				fetchBooking();
				setRefresh((prev) => !prev);
		}
	};

	const handleNotice = (noticeMsg: NoticeMessage) => {
		setNotice(noticeMsg);
		// Auto-hide notice after 3 seconds
		setTimeout(() => setNotice(null), 3000);
	};

	const navigate = useNavigate();
	const hasNavigatedBackRef = useRef(false);
	const handleClose = () => {
		if (hasNavigatedBackRef.current) return;
		hasNavigatedBackRef.current = true;
		setIsDialogOpen(false);
		navigate(getToLink('booking/bookings'), { replace: true });
	};

	const fetchBooking = async () => {
		setIsLoading(true);

		callApi({
			path: `bookings/${bookingId}`,
			method: 'GET',
			onSuccess: (response) => {
				setBooking(response);
				setIsLoading(false);
			},
			onError: (error) => {
				console.error(error);
				handleNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message:
						error ||
						__('Error fetching booking details', 'doublescale'),
				});
				setIsLoading(false);
			},
		});
	};

	const fetchUpcomingBookings = (
		day: string,
		month: number,
		year: number
	) => {
		callApi({
			path: addQueryArgs('bookings', {
				filter: {
					period: 'upcoming',
					// user: author.toLowerCase(),
					year,
					month,
					day,
				},
			}),
			method: 'GET',
			onSuccess: (res) => {
				const bookings = groupBookingsByDate(
					res.bookings.data,
					res.time_format
				);
				setTimeFormat(res.time_format);
				setBookings(bookings);
			},
			onError: () => {
				handleNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message: __('Error fetching bookings', 'doublescale'),
				});
			},
		});
	};

	useEffect(() => {
		if (bookingId) {
			fetchBooking();
		}
	}, [bookingId, refresh]);

	useEffect(() => {
		fetchUpcomingBookings(
			days[selectedDate].dayOfMonth,
			days[selectedDate].month,
			days[selectedDate].year
		);
	}, [selectedDate, refresh]);

	// Format date/time information only once.
	const { date, time } = booking?.start_time
		? convertTimezone(booking.start_time, getCurrentTimezone())
		: { date: '', time: '' };

	const endTime =
		booking && booking.start_time && booking.slot_time
			? (() => {
					const [hours, minutes] = time.split(':').map(Number);
					const totalMinutes =
						hours * 60 + minutes + Number(booking.slot_time);
					const endHours = Math.floor(totalMinutes / 60);
					const endMinutes = totalMinutes % 60;
					return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
				})()
			: '';

	return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={open => {
                if (!open)
                    handleClose();
            }}><DialogContent
                hideCloseButton
                className='!fixed !inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !rounded-none !p-0 !gap-0 !border-0 z-[160000] grid-rows-[auto_1fr] overflow-hidden bg-white'>
                {isLoading ? (
                    <div className='h-full overflow-y-auto'>
                        <ShimmerLoader />
                    </div>
                ) : (
                    <div className='flex flex-col h-full overflow-hidden'>
                        <div
                            className='flex justify-between border-b border-[#E5E5E5] px-5 py-7 w-full shrink-0'>
                            <div>
                                <div className='flex gap-2.5 items-center'>
                                    <div
                                        className="text-color-primary-text cursor-pointer pr-2"
                                        onClick={handleClose}
                                    >
                                        <CancelIcon width={30} height={30} />
                                    </div>
                                    <p className="text-2xl text-[#09090B] font-medium">
                                        {__('Booking Details', 'doublescale')}
                                    </p>
                                </div>
                            </div>
                            {booking && (
                                <div className="flex justify-end">
                                    <BookingActions
                                        booking={booking}
                                        type="button"
                                        onStatusUpdated={handleStatusUpdated}
                                        onNotice={handleNotice}
                                    />
                                </div>
                            )}
                        </div>
                        <div className='flex-1 overflow-y-auto'>
                            {notice && (
                                <div className="mt-4 mx-16">
                                    <NoticeBanner
                                        notice={notice}
                                        closeNotice={() => setNotice(null)}
                                    />
                                </div>
                            )}
                            <div className='flex gap-10 items-start p-16 pt-8'>
                                {booking && (
                                    <div className='flex flex-col gap-5 flex-1 min-w-0'>
                                        <MeetingInformation booking={booking} />
                                        <BookingQuestion booking={booking} />
                                        <PaymentHistory booking={booking} />
                                        <InviteeInformation
                                            booking={booking}
                                            timeFormat={timeFormat}
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col flex-1 gap-4 min-w-0">
                                    <div className="bg-primary p-8 rounded-2xl text-white">
                                        <UpcomingCalendarIcon width={60} height={60} />
                                        <p className="text-lg font-normal my-1">
                                            {__('Event Date/Time', 'doublescale')}
                                        </p>
                                        <p className="text-2xl font-medium">
                                            {date} - {formatTime(time, timeFormat)}
                                            {' - '}
                                            {formatTime(endTime, timeFormat)}
                                        </p>
                                    </div>
                                    {booking && (
                                        <MeetingActivities
                                            booking={booking}
                                            timeFormat={timeFormat}
                                        />
                                    )}
                                    <BookingList
                                        bookings={Object.values(bookings)[0] || []}
                                        setSelectedDate={setSelectedDate}
                                        days={days}
                                        selectedDate={selectedDate}
                                        setBookingId={setBookingId}
                                    />
                                </div>
                            </div>
                        </div>
                        {open && (
                            <AddBookingModal
                                open={open}
                                onClose={() => setOpen(false)}
                                onSaved={() => {
                                    setOpen(false);
                                    handleClose();
                                }}
                                booking={booking || undefined}
                            />
                        )}
                    </div>
                )}
            </DialogContent></Dialog>
    );
};

export default BookingDetails;
