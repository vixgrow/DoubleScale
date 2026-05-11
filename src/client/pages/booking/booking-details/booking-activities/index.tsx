/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Booking } from '@/types/booking';
import { convertTimezone, getCurrentTimezone } from '@/utils/booking';
import { CardHeader } from '@/components/booking';
import { CompassIcon, FailIcon, SuccesIcon } from '@/components/booking';

interface MeetingActivitiesProps {
	booking: Booking;
	timeFormat: string;
}

const MeetingActivities: React.FC<MeetingActivitiesProps> = ({
	booking,
	timeFormat,
}) => {
	return (
        <div className="border px-10 py-8 rounded-2xl flex flex-col gap-5 max-h-[500px] overflow-y-auto">
            <CardHeader
				title={__('Meeting Activities', 'doublescale')}
				description={__(
					'Timeline about all Booking Activities',
					'doublescale'
				)}
				icon={<CompassIcon />}
			/>
            {(booking.logs?.length ?? 0) > 0 ? (
				booking.logs?.map((log, idx) => (
					<div key={log.id ?? idx} className="flex gap-2">
						<div
							className={`border-2 ${log.type == 'info' ? 'border-[#A5E0B5]' : 'border-[#F7A8A4]'} rounded-3xl`}
						></div>
						<div className="bg-[#F1F1F2] p-2 rounded-md h-fit self-center">
							{log.type == 'info' ? <SuccesIcon /> : <FailIcon />}
						</div>
						<div className="flex flex-col">
							{(() => {
								const { date, time } = convertTimezone(
									log.created_at,
									getCurrentTimezone()
								);

								// Convert to Date object
								const formattedDate = new Date(
									`${date} ${time}`
								).toLocaleString('en-US', {
									year: 'numeric',
									month: 'long', // "March"
									hour: 'numeric',
									minute: '2-digit',
									hour12: timeFormat === '12', // Use global time format setting
								});

								return <p>{formattedDate}</p>;
							})()}
							<p className="text-sm text-color-primary-text font-semibold">
								{log.message}
							</p>
						</div>
					</div>
				))
			) : (
				<span>
					{__(
						'No activities have been recorded for this booking',
						'doublescale'
					)}
				</span>
			)}
        </div>
    );
};

export default MeetingActivities;
