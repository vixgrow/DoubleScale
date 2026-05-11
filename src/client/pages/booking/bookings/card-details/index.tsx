/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Booking } from '@/types/booking';
import {
	PriceIcon,
	ClockIcon,
	LocationIcon,
	LinkIcon,
	AttendeeIcon,
	LocationDisplay,
	EventUrl,
} from '@/components/booking';
import { NavLink as Link } from '@doublescale/navigation';

interface CardDetailsProps {
	booking: Booking;
	period: string;
}

const CardDetails: React.FC<CardDetailsProps> = ({ booking, period }) => {
	const event = booking.event;
	const service = (booking as any).service;
	const eventTitle =
		booking.booking_title || event?.name || service?.name || '';
	const duration = event?.duration ?? service?.duration ?? booking.slot_time;
	const paymentsEnabled =
		event?.payments_settings?.enable_payment ??
		service?.payments_settings?.enable_payment ??
		false;

	return (
        <div className='flex gap-3 flex-wrap flex-1 min-w-0'>
            <div className="flex-1 min-w-[200px] max-w-[400px]">
				<Link to={`booking/bookings/${booking.id}/${period}`}>
					<p className="text-lg font-bold text-color-primary-text py-1 break-words">
						{eventTitle}
					</p>
				</Link>
				<div className='flex gap-[3px] items-center my-1'>
					<ClockIcon />
					<p className="break-words text-sm">
						{duration ? `${duration} ${__('min', 'doublescale')} ` : ''}
						{booking.time_span}
					</p>
				</div>
				<div className='flex gap-[3px] items-center'>
					<LocationIcon rectFill={false} width={18} height={18} />
					<LocationDisplay location={booking.location} />
				</div>
			</div>
            <div className="flex-1 min-w-[200px] max-w-[400px]">
				<div className='flex gap-1.5 items-center'>
					<PriceIcon width={18} height={18} rectFill={false} />
					<span className="text-[#71717A] text-xs">
						{__('Price', 'doublescale')}
					</span>
					<span className="text-[#007AFF] text-sm font-[500] capitalize">
						{booking.order != null
							? booking.order.total
							: paymentsEnabled
								? __('Not Paid Yet', 'doublescale')
								: __('Free', 'doublescale')}
					</span>
				</div>

				<div className='flex gap-[3px] items-center my-1'>
					<span className="text-color-primary-text">
						<AttendeeIcon width={18} height={18} />
					</span>
					<p className="text-sm">
						{__('Attendees', 'doublescale')} 1{' '}
						{__('person', 'doublescale')}
					</p>
				</div>
				{event?.calendar?.slug && event?.slug && (
					<div className='flex gap-[3px] items-center overflow-hidden'>
						<span className="text-color-primary-text flex-shrink-0">
							<LinkIcon width={18} height={18} />
						</span>
						<EventUrl
							calendarSlug={event.calendar.slug}
							eventSlug={event.slug}
						/>
					</div>
				)}
			</div>
        </div>
    );
};

export default CardDetails;
