/*
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Booking, NoticeMessage } from '@/types/booking';
import { CompletedCalendarIcon } from '@/components/booking';
import CardDetails from '../card-details';
import { BookingActions } from '@/components/booking';

/**
 * Main Bookings List Component.
 */
interface BookingListProps {
	bookings: Record<string, Booking[]>;
	period: string;
	onStatusUpdated: () => void;
	onNotice: (notice: NoticeMessage) => void;
}

const BookingList: React.FC<BookingListProps> = ({
	bookings,
	period,
	onStatusUpdated,
	onNotice,
}) => {
	return (
        <>
            {Object.entries(bookings).map(([dateLabel, bookings]) => {
				const [day, number] = dateLabel.split('-');
				return (
                    <div
						className="flex flex-col md:flex-row gap-8 border-solid border border-[#DEE1E6] bottom-2 p-7 my-3 rounded-xl"
						key={dateLabel}
					>
                        <div className="flex flex-col justify-center items-center bg-primary text-white rounded-2xl p-2 w-24 h-24">
							<span className="text-base">
								{day.charAt(0).toUpperCase() + day.slice(1)}
							</span>
							<span className="text-4xl font-bold">{number}</span>
						</div>
                        <div className="w-full">
							{bookings.length > 1 && (
								<div className="relative pl-8">
									{bookings.map((booking, idx) => (
										<div key={booking.id} className="relative pb-8 last:pb-0">
											{idx < bookings.length - 1 && (
												<span className="absolute left-[-20px] top-6 bottom-0 w-px bg-primary" />
											)}
											<span className="absolute left-[-32px] top-0">
												<CompletedCalendarIcon width={24} height={25} />
											</span>
											<div className='flex justify-between items-center border-b border-dashed border-[#DEE1E6] pb-8'>
												<CardDetails booking={booking} period={period} />
												<BookingActions
													booking={booking}
													type="popover"
													onStatusUpdated={onStatusUpdated}
													onNotice={onNotice}
												/>
											</div>
										</div>
									))}
								</div>
							)}

							{bookings.length === 1 &&
								bookings.map((booking: Booking) => (
									<div key={booking.id} className='flex justify-between items-center'>
										<CardDetails
											booking={booking}
											period={period}
										/>
										<BookingActions
											type="popover"
											booking={booking}
											onStatusUpdated={onStatusUpdated}
											onNotice={onNotice}
										/>
									</div>
								))}
						</div>
                    </div>
                );
			})}
        </>
    );
};

export default BookingList;
