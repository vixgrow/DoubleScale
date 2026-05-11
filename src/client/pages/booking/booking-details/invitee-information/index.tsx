/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Booking } from '@/types/booking';
import {
	AttendeeIcon,
	ClockIcon,
	EmailIcon,
	TeamOutlinedIcon,
	TimezoneIcon,
} from '@/components/booking';
import { CardHeader } from '@/components/booking';
import { convertTimezone, getCurrentTimezone } from '@/utils/booking';
import InfoItem from '../info-items';

/*
 * Main Invitee Information Component
 */
interface BookingDetailsProps {
	booking: Booking;
	timeFormat: string;
}

const InviteeInformation: React.FC<BookingDetailsProps> = ({
	booking,
	timeFormat,
}) => {
	return (
		<div className="border px-10 py-8 rounded-2xl flex flex-col gap-5">
			<CardHeader
				title={__('Invitees Information', 'doublescale')}
				description={__(
					'All Data about Invitees Information',
					'doublescale'
				)}
				icon={<TeamOutlinedIcon width={24} height={24} />}
			/>
			<div className="flex flex-col gap-4">
				<InfoItem
					icon={<AttendeeIcon width={24} height={24} />}
					title={__('Invitee Name', 'doublescale')}
					content={
						booking.contact
							? [booking.contact.first_name, booking.contact.last_name]
									.filter(Boolean)
									.join(' ') || booking.contact.email
							: ''
					}
				/>

				<InfoItem
					icon={<EmailIcon width={24} height={24} />}
					title={__('Invitee Email', 'doublescale')}
					preserveCase
					content={booking.contact?.email}
				/>

				<InfoItem
					icon={<TimezoneIcon width={24} height={24} />}
					title={__('Invitee Timezone', 'doublescale')}
					preserveCase
					content={booking.timezone}
				/>

				<InfoItem
					icon={<ClockIcon width={24} height={24} />}
					title={__('Booked At', 'doublescale')}
					preserveCase
					content={(() => {
						if (!booking.created_at) return '';

						const { date, time } = convertTimezone(
							booking.created_at,
							getCurrentTimezone()
						);

						// Convert to Date object and format properly
						const formattedDate = new Date(
							`${date} ${time}`
						).toLocaleString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: 'numeric',
							minute: '2-digit',
							hour12: timeFormat === '12', // Use global time format setting
						});

						return formattedDate;
					})()}
				/>
			</div>
		</div>
	);
};

export default InviteeInformation;
