/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
	MessageStatsCard,
} from '@quillcrm/components';
import { EmailsAnalytics } from '@quillcrm/client';
import EmailActivityIcon from '@quillcrm/components/icons/email-activity';
import EmailOpenIcon from '@quillcrm/components/icons/email-open';
import EmailClickIcon from '@quillcrm/components/icons/email-click';

interface EmailStatsCardsProps {
	data: EmailsAnalytics;
}

export const EmailStatsCards: React.FC<EmailStatsCardsProps> = ({ data }) => {
	return (
		<div className="flex gap-5">
			
			
			<MessageStatsCard
					icon={<EmailActivityIcon color='#458DC7' width={40} height={40}  />}
					value={data.total_sent || 0}
					label={__('Total Sent Emails', 'quillcrm')}
					iconBgClass="bg-[#E4EEFD]"
					borderColorClass="border-l-[#458DC7]"
					iconColor="text-[#458DC7]"
					className='py-5'
				/>
				<MessageStatsCard
					icon={<EmailOpenIcon width={40} height={40}  />}
					value={data.total_opened || 0}
					label={__('Total Opened', 'quillcrm')}
					iconBgClass="bg-[#D1F6DF]"
					borderColorClass="border-l-[#16A34A]"
					iconColor="text-[#16A34A]"
					className='py-5'
				/>
				<MessageStatsCard
					icon={<EmailClickIcon />}
					value={data.total_clicked || 0}
					label={__('Total Clicked', 'quillcrm')}
					iconBgClass="bg-[#EEE4FF]"
					borderColorClass="border-l-[#660FF1]"
					iconColor="text-[#660FF1]"
					className='py-5'
				/>

			
			
		</div>
	);
};
