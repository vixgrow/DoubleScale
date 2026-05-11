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
import EmailActivityIcon from '@doublescale/shared/icons/email-activity';
import EmailOpenIcon from '@doublescale/shared/icons/email-open';
import EmailClickIcon from '@doublescale/shared/icons/email-click';

interface EmailStatsCardsProps {
	data: EmailsAnalytics;
}

export const EmailStatsCards: React.FC<EmailStatsCardsProps> = ({ data }) => {
	return (
		<div className="flex gap-5">
			<MessageStatsCard
				icon={<EmailActivityIcon width={40} height={40} />}
				value={data.total_sent || 0}
				label={__('Total Sent Emails', 'doublescale')}
				iconBgClass="bg-primary/10"
				iconColor="text-primary"
				className="py-5"
			/>
			<MessageStatsCard
				icon={<EmailOpenIcon width={40} height={40} />}
				value={data.total_opened || 0}
				label={__('Total Opened', 'doublescale')}
				iconBgClass="bg-emerald-50"
				iconColor="text-emerald-600"
				className="py-5"
			/>
			<MessageStatsCard
				icon={<EmailClickIcon />}
				value={data.total_clicked || 0}
				label={__('Total Clicked', 'doublescale')}
				iconBgClass="bg-violet-50"
				iconColor="text-violet-600"
				className="py-5"
			/>
		</div>
	);
};
