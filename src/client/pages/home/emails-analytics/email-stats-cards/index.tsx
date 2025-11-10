/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
	DashboardSmallCard,
	MailClickedIcon,
	MailOpenedIcon,
	MailSentIcon,
} from '@quillcrm/components';
import { EmailsAnalytics } from '@quillcrm/client';

interface EmailStatsCardsProps {
	data: EmailsAnalytics;
}

export const EmailStatsCards: React.FC<EmailStatsCardsProps> = ({ data }) => {
	return (
		<div className="flex gap-5">
			<DashboardSmallCard
				title={__('Total Sent', 'quillcrm')}
				subtitle={data.total_sent || 0}
				icon={<MailSentIcon />}
			/>
			<DashboardSmallCard
				title={__('Total Opened', 'quillcrm')}
				subtitle={data.total_opened || 0}
				icon={<MailOpenedIcon />}
			/>
			<DashboardSmallCard
				title={__('Total Clicked', 'quillcrm')}
				subtitle={data.total_clicked || 0}
				icon={<MailClickedIcon />}
			/>
		</div>
	);
};
