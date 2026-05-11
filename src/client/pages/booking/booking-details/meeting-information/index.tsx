/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Booking } from '@/types/booking';
import {
	CardHeader,
	EventUrl,
	LocationDisplay,
	PriceIcon,
} from '@/components/booking';
import {
	AllCalendarIcon,
	CalendarInformationIcon,
	ClockIcon,
	HostIcon,
	LinkIcon,
	LocationIcon,
	StatusIcon,
} from '@/components/booking';
import InfoItem from '../info-items';

/*
 * Main Meeting Information Component
 */
interface BookingDetailsProps {
	booking: Booking;
}

const MeetingInformation: React.FC<BookingDetailsProps> = ({ booking }) => {
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
		<div className="border px-10 py-8 rounded-2xl flex flex-col gap-5">
			<CardHeader
				title={__('Booking Information', 'doublescale')}
				description={__(
					'All Data about Booking Information',
					'doublescale'
				)}
				icon={<CalendarInformationIcon width={24} height={24} />}
			/>
			<InfoItem
				title={__('Event Title', 'doublescale')}
				content={eventTitle}
				icon={<AllCalendarIcon width={24} height={24} />}
			/>

			<div className="grid grid-cols-2 gap-4">
				<InfoItem
					title={__('Event Host', 'doublescale')}
					content={booking.hosts
						?.map((host) => host.display_name)
						.join('- ') || ''}
					icon={<HostIcon width={24} height={24} />}
				/>
				<InfoItem
					title={__('Event Duration', 'doublescale')}
					content={
						duration
							? `${duration} ${__('min', 'doublescale')}`
							: ''
					}
					icon={<ClockIcon width={24} height={24} />}
				/>
				<InfoItem
					title={__('Event Location', 'doublescale')}
					preserveCase
					content={<LocationDisplay location={booking.location} />}
					icon={
						<LocationIcon width={24} height={24} rectFill={false} />
					}
				/>
				<InfoItem
					title={__('Status', 'doublescale')}
					content={booking.status}
					icon={<StatusIcon width={24} height={24} />}
				/>
				<InfoItem
					title={__('Price', 'doublescale')}
					content={
						<span className="text-[#007AFF] text-sm font-[500] capitalize">
							{booking.order != null
								? booking.order.total
								: paymentsEnabled
									? __('Not Paid Yet', 'doublescale')
									: __('Free', 'doublescale')}
						</span>
					}
					icon={<PriceIcon rectFill={false} width={24} height={24} />}
				/>
				{event?.calendar?.slug && event?.slug && (
					<InfoItem
						title={__('Event Link', 'doublescale')}
						preserveCase
						content={
							<EventUrl
								className="text-base leading-5 font-medium break-all"
								calendarSlug={event.calendar.slug}
								eventSlug={event.slug}
							/>
						}
						icon={<LinkIcon width={24} height={24} />}
					/>
				)}
			</div>
		</div>
	);
};

export default MeetingInformation;
