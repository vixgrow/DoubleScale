/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Booking } from '@/types/booking';
import { CardHeader } from '@/components/booking';
import { LatestCalendarIcon } from '@/components/booking';

/*
 * Main Booking List Component (Details Page)
 */
interface BookingListProps {
	bookings: Booking[];
	days: {
		weekday: string;
		dayOfMonth: string;
		month: number;
		year: number;
	}[];
	selectedDate: number;
	setSelectedDate: (date: number) => void;
	setBookingId: (id: string | number) => void;
}
const BookingList: React.FC<BookingListProps> = ({
	bookings,
	days,
	setSelectedDate,
	selectedDate,
	setBookingId,
}) => {
	return (
		<div className="border px-10 py-8 rounded-2xl flex flex-col gap-5 max-h-[500px] overflow-y-auto">
			<CardHeader
				title={__('Upcoming Booking', 'doublescale')}
				description={__(
					'Timeline about all Booking Activities',
					'doublescale'
				)}
				icon={<LatestCalendarIcon width={24} height={24} />}
			/>
			<div className="grid grid-cols-10 gap-1 items-center">
				{days.map((day, index) => {
					const isSelected = index === selectedDate;
					return (
						<button
							type="button"
							className={`flex flex-col items-center justify-center text-center cursor-pointer rounded-full py-2 transition-colors ${isSelected ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
							key={`${day.year}-${day.month}-${day.dayOfMonth}`}
							onClick={() => setSelectedDate(index)}
						>
							<p className={`text-xs ${isSelected ? 'text-white' : 'text-[#71717A]'}`}>
								{day.weekday}
							</p>
							<p
								className={`font-semibold text-base ${isSelected ? 'text-white' : 'text-[#3F4254]'}`}
							>
								{day.dayOfMonth}
							</p>
						</button>
					);
				})}
			</div>

			<div>
				{bookings.length > 0 &&
					bookings.map((booking) => {
						const eventTitle =
							booking.booking_title || booking.event?.name || '';
						return (
							<div
								key={booking.id}
								className="flex justify-between items-center my-4"
							>
								<div className="flex gap-2 font-semibold">
									<div className="border-2 border-[#A5E0B5] rounded-3xl"></div>
									<div>
										<p>{booking.time_span}</p>
										<p className="text-[#3F4254]">
											{eventTitle}
										</p>
										<p>
											{__('Hosted by', 'doublescale')}{' '}
											<span className="text-primary">
												{
													booking.calendar?.user
														?.display_name
												}
											</span>
										</p>
									</div>
								</div>

								<button
									type="button"
									className="px-4 py-2 bg-[#F1F1F2] rounded-md text-[#5E6278] cursor-pointer hover:bg-[#E4E4E7]"
									onClick={() => setBookingId(booking.id)}
								>
									{__('View', 'doublescale')}
								</button>
							</div>
						);
					})}
			</div>
		</div>
	);
};

export default BookingList;
