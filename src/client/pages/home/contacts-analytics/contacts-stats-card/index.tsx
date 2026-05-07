/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
	ContactsIcon,
	DashboardSmallCard,
	MessageStatsCard,
	SubscribersIcon,
	TotalContactsIcon,
	UnsubscribersIcon,
} from '@doublescale/components';
import type { ContactAnalytics as ContactAnalyticsData } from '@doublescale/client';
import SubscribersContactIcon from '@doublescale/components/icons/subscribe-contact';
import UnSubscribersContactIcon from '@doublescale/components/icons/unsubscribe-Contact';

interface ContactStatsCardsProps {
	data: ContactAnalyticsData;
}

export const ContactStatsCards: React.FC<ContactStatsCardsProps> = ({
	data,
}) => {
	return (
		<div className="flex flex-col gap-5">
			{/* <DashboardSmallCard
				title={__('Total Contacts', 'doublescale')}
				subtitle={data.total}
				icon={<TotalContactsIcon />}
			/>
			<DashboardSmallCard
				title={__('Total Subscribers', 'doublescale')}
				subtitle={data.total_subscribed}
				icon={<SubscribersIcon />}
			/>
			<DashboardSmallCard
				title={__('Total Unsbscribers', 'doublescale')}
				subtitle={data.total_unsubscribed}
				icon={<UnsubscribersIcon />}
			/> */}
			<MessageStatsCard
					icon={<ContactsIcon width={40} height={40}  />}
					value={data.total}
					label={__('Total Contacts', 'doublescale')}
					iconBgClass="bg-[#E4EEFD]"
					borderColorClass="border-l-[#1E3A8A]"
					iconColor="text-[#1E3A8A]"
					className='py-5'
				/>
				<MessageStatsCard
					icon={<SubscribersContactIcon color='#16A34A'/>}
					value={data.total_subscribed}
					label={__('Total Subscribers', 'doublescale')}
					iconBgClass="bg-[#E4FAEC]"
					borderColorClass="border-l-[#16A34A]"
					iconColor="text-[#16A34A]"
					className='py-5'
				/>
				<MessageStatsCard
					icon={<UnSubscribersContactIcon />}
					value={data.total_unsubscribed}
					label={__('Total Unsbscribers', 'doublescale')}
					iconBgClass="bg-[#FBE8E8]"
					borderColorClass="border-l-[#E13B3B]"
					iconColor="text-[#E13B3B]"
					className='py-5'
				/>
		</div>
	);
};
