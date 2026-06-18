/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { Plus as PlusOutlined } from 'lucide-react';

/**
 * Internal dependencies
 */
import {
	Booking,
	BookingsTabsTypes,
	Event,
	GeneralOptions,
	NoticeMessage,
} from '@/types/booking';
import { useApi, useCurrentUser } from '@/hooks/booking';
import BookingsHeader from './header';
import BookingsTabs from './tabs';
import SearchFilter from './search-filter';
import { groupBookingsByDate } from '@/utils/booking';
import BookingList from './booking-list';
import AddBookingModal from '@/components/booking/add-booking-modal';
import MonthSelector from './month-selector';
import { NoticeBanner, UpcomingCalendarIcon } from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BookingsShimmer = () => {
	return (
        <div className="space-y-4">
            {[1, 2, 3].map((date) => (
				<Card key={date} className="rounded-xl"><CardContent>
                        <div className="animate-pulse">
                            <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
                            <div className="space-y-4">
                                {[1, 2].map((booking) => (
                                    <div
                                        key={booking}
                                        className="border rounded-lg p-4"
                                    >
                                        <div className='flex justify-between items-center'>
                                            <div className='flex gap-1 flex-col'>
                                                <div className="h-5 w-64 bg-gray-200 rounded" />
                                                <div className="h-4 w-48 bg-gray-200 rounded" />
                                                <div className="h-4 w-32 bg-gray-200 rounded mt-2" />
                                            </div>
                                            <div className='flex gap-[3px]'>
                                                <div className="w-8 h-8 bg-gray-200 rounded" />
                                                <div className="w-8 h-8 bg-gray-200 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent></Card>
			))}
        </div>
    );
};

/**
 * Main Bookings Component.
 */
const Bookings: React.FC = () => {
	const [open, setOpen] = useState<boolean>(false);
	const [period, setPeriod] = useState<BookingsTabsTypes>('all');
	const [author, setAuthor] = useState<string>('own');
	const [event, setEvent] = useState<string | number>('all');
	const [eventType, setEventType] = useState<string>('all');
	const [pendingBookingCount, setPendingBookingCount] = useState<number>(0);
	const [cancelledBookingCount, setCancelledBookingCount] =
		useState<number>(0);
	const [noShowCount, setNoShowCount] = useState<number>(0);
	const [waitingCount, setWaitingCount] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(true);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
	const [eventsOptions, setEventsOptions] = useState<GeneralOptions[]>([
		{ value: 'all', label: __('All Events & Services', 'doublescale') },
	]);
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);
	const currentMonth = new Date().getMonth() + 1;
	const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
	const [updateStatus, setUpdateStatus] = useState<boolean>(false);
	const canManageAllBookings = useCurrentUser().hasCapability(
		'doublescale_booking_manage_all_bookings'
	);
	const { callApi } = useApi();

	const fetchEvents = () => {
		callApi({
			path: 'events',
			method: 'GET',
			onSuccess: (res) => {
				const events = res.data.map((event: Event) => ({
					value: `event_${event.id}`,
					label: event.name,
				}));
				setEventsOptions((prevOptions) => [...prevOptions, ...events]);
			},
			onError: () => {
				setNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message: __('Error fetching events', 'doublescale'),
				});
			},
		});
	};

	const fetchBookings = (search?: string) => {
		setLoading(true);
		callApi({
			path: addQueryArgs('bookings', {
				filter: {
					period: period,
					user: author.toLowerCase(),
					event:
						typeof event === 'string' ? event.toLowerCase() : event,
					event_type: eventType.toLowerCase(),
					search: search?.toLowerCase(),
					year: year,
					month: selectedMonth,
				},
			}),
			method: 'GET',
			onSuccess: (res) => {
				const bookings = groupBookingsByDate(
					res.bookings.data,
					res.time_format
				);
				setBookings(bookings);
				setPendingBookingCount(res.pending_count);
				setCancelledBookingCount(res.cancelled_count);
				setNoShowCount(res.noshow_count);
				setWaitingCount(res.waiting_count);
				setLoading(false);
			},
			onError: () => {
				setNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message: __('Error fetching bookings', 'doublescale'),
				});
				setLoading(false);
			},
		});
	};

	const handleSearch = (val: string) => {
		fetchBookings(val);
	};

	const handleNotice = (newNotice: NoticeMessage) => {
		setNotice(newNotice);
		// Auto-hide notice after 3 seconds
		setTimeout(() => {
			setNotice(null);
		}, 3000);
	};

	useEffect(() => {
		fetchEvents();
		fetchBookings();
	}, []);

	useEffect(() => {
		fetchBookings();
	}, [period, author, event, eventType, updateStatus, year, selectedMonth]);

	return (
        <div className="h-fit min-w-0">
            <BookingsHeader handleOpen={setOpen} />
            <div className="my-6 flex w-full min-w-0 flex-col gap-4 overflow-hidden rounded-xl border border-solid border-[#DEDEDE] p-4">
                <BookingsTabs
                    setPeriod={setPeriod}
                    period={period}
                    pendingCount={pendingBookingCount}
                    cancelled={cancelledBookingCount}
                    noShowCount={noShowCount}
                    waitingCount={waitingCount}
                />

                <SearchFilter
                    canManageAllBookings={canManageAllBookings}
                    event={event}
                    eventType={eventType}
                    author={author}
                    events={eventsOptions}
                    setAuthor={setAuthor}
                    setEvent={setEvent}
                    setEventType={setEventType}
                    handleSearch={handleSearch}
                />
            </div>
            <MonthSelector
				year={year}
				setYear={setYear}
				selectedMonth={selectedMonth}
				setSelectedMonth={setSelectedMonth}
			/>
            {notice && (
				<div className="mt-4">
					<NoticeBanner
						notice={notice}
						closeNotice={() => setNotice(null)}
					/>
				</div>
			)}
            {loading ? (
				<BookingsShimmer />
			) : Object.keys(bookings).length > 0 ? (
				<BookingList
					bookings={bookings}
					period={period}
					onStatusUpdated={() => setUpdateStatus((prev) => !prev)}
					onNotice={handleNotice}
				/>
			) : (
				<div className="flex flex-col gap-4 justify-center items-center mt-4 h-full border border-solid borderColor-[#DEDEDE] rounded-xl p-4 my-6 py-6 bg-[#FDFDFD]">
					<div className="w-36 h-36 flex justify-center items-center rounded-full bg-[#F4F5FA] border border-solid borderColor-[#E1E2E9]">
						<UpcomingCalendarIcon width={60} height={60} />
					</div>

					<p className="text-xl font-medium my-1 text-color-primary-text">
						{__('No Bookings Yet?', 'doublescale')}
					</p>

					<p>
						{__(
							'You can also Book Events Manually.',
							'doublescale'
						)}
					</p>

					<Button
						className="bg-primary text-white"
						onClick={() => {
							setOpen(true);
						}}
						variant='default'
						size='lg'
					>
						<PlusOutlined />
						{__('Add Booking Manually', 'doublescale')}
					</Button>
				</div>
			)}
            {open && (
				<AddBookingModal
					open={open}
					onClose={() => setOpen(false)}
					onSaved={() => {
						setOpen(false);
						setUpdateStatus((prev) => !prev);
						handleNotice({
							type: 'success',
							title: __('Success', 'doublescale'),
							message: __(
								'Booking added successfully',
								'doublescale'
							),
						});
					}}
				/>
			)}
        </div>
    );
};

export default Bookings;
