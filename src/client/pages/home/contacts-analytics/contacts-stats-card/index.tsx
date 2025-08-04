/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
	DashboardSmallCard,
	SubscribersIcon,
	TotalContactsIcon,
	UnsubscribersIcon,
} from '@quillcrm/components';
import type { ContactAnalytics as ContactAnalyticsData } from '@quillcrm/client';

interface ContactStatsCardsProps {
	data: ContactAnalyticsData;
}

export const ContactStatsCards: React.FC<ContactStatsCardsProps> = ({
	data,
}) => {
	return (
		<div className="flex gap-5">
			<DashboardSmallCard
				title={__('Total Contacts', 'quillcrm')}
				subtitle={data.total}
				icon={<TotalContactsIcon />}
			/>
			<DashboardSmallCard
				title={__('Total Subscribers', 'quillcrm')}
				subtitle={data.total_subscribed}
				icon={<SubscribersIcon />}
			/>
			<DashboardSmallCard
				title={__('Total Unsbscribers', 'quillcrm')}
				subtitle={data.total_unsubscribed}
				icon={<UnsubscribersIcon />}
			/>
		</div>
	);
};
