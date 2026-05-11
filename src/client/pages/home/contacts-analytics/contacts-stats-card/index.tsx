/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
	ContactsIcon,
	MessageStatsCard,
} from '@doublescale/components';
import type { ContactAnalytics as ContactAnalyticsData } from '@doublescale/client';
import SubscribersContactIcon from '@doublescale/shared/icons/subscribe-contact';
import UnSubscribersContactIcon from '@doublescale/shared/icons/unsubscribe-Contact';

interface ContactStatsCardsProps {
	data: ContactAnalyticsData;
}

export const ContactStatsCards: React.FC<ContactStatsCardsProps> = ({
	data,
}) => {
	return (
		<div className="flex flex-col gap-5">
			<MessageStatsCard
				icon={<ContactsIcon width={40} height={40} />}
				value={data.total}
				label={__('Total Contacts', 'doublescale')}
				iconBgClass="bg-primary/10"
				iconColor="text-primary"
				className="py-5"
			/>
			<MessageStatsCard
				icon={<SubscribersContactIcon />}
				value={data.total_subscribed}
				label={__('Total Subscribers', 'doublescale')}
				iconBgClass="bg-emerald-50"
				iconColor="text-emerald-600"
				className="py-5"
			/>
			<MessageStatsCard
				icon={<UnSubscribersContactIcon />}
				value={data.total_unsubscribed}
				label={__('Total Unsubscribers', 'doublescale')}
				iconBgClass="bg-red-50"
				iconColor="text-red-500"
				className="py-5"
			/>
		</div>
	);
};
