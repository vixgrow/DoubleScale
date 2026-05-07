/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
	MessageStatsCard,
} from '@doublescale/components';
import { EmailsAnalytics } from '@doublescale/client';
import EmailActivityIcon from '@doublescale/components/icons/email-activity';
import EmailOpenIcon from '@doublescale/components/icons/email-open';
import EmailClickIcon from '@doublescale/components/icons/email-click';

interface EmailStatsCardsProps {
	data: EmailsAnalytics;
}

export const EmailStatsCards: React.FC<EmailStatsCardsProps> = ({ data }) => {
	return (
		<div className="flex gap-5">
			
			
			<MessageStatsCard
					icon={<EmailActivityIcon color='#458DC7' width={40} height={40}  />}
					value={data.total_sent || 0}
					label={__('Total Sent Emails', 'doublescale')}
					iconBgClass="bg-[#E4EEFD]"
					borderColorClass="border-l-[#458DC7]"
					iconColor="text-[#458DC7]"
					className='py-5'
				/>
				<MessageStatsCard
					icon={<EmailOpenIcon width={40} height={40}  />}
					value={data.total_opened || 0}
					label={__('Total Opened', 'doublescale')}
					iconBgClass="bg-[#D1F6DF]"
					borderColorClass="border-l-[#16A34A]"
					iconColor="text-[#16A34A]"
					className='py-5'
				/>
				<MessageStatsCard
					icon={<EmailClickIcon />}
					value={data.total_clicked || 0}
					label={__('Total Clicked', 'doublescale')}
					iconBgClass="bg-[#EEE4FF]"
					borderColorClass="border-l-[#660FF1]"
					iconColor="text-[#660FF1]"
					className='py-5'
				/>

			
			
		</div>
	);
};
