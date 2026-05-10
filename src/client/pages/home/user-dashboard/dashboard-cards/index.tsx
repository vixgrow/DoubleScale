/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import {
	DashboardContentCard,
	MessageStatsCard,
	DealsWonValueIcon,
	DealsClosedWonIcon,
	ContactsIcon,
	ContactTotalEmailsIcon,
	TagsIcon,
	AutomationsIcon,
	DealsIcon,
	ListsIcon,
} from '@doublescale/components';
import type { DashboardData } from '@doublescale/client';
import config from '@doublescale/config';

interface DashboardCardsProps {
	data: DashboardData;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ data }) => {
	const contactsOn = config.isModuleToggleEnabled('contacts');
	const trackingOn = config.isModuleToggleEnabled('tracking');
	const automationsOn = config.isModuleToggleEnabled('automations');
	const dealsOn = config.isModuleToggleEnabled('deals');

	return (
		<DashboardContentCard
			title={__('Analytics Overview', 'doublescale')}
			cardClassName="w-full"
		>
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
				{contactsOn && (
					<MessageStatsCard
						label={__('Total Contacts', 'doublescale')}
						value={data.total_contacts || 0}
						icon={<ContactsIcon width={40} height={40} />}
						iconBgClass="bg-[#E3EEFF99]"
						borderColorClass="border-l-primary"
						iconColor="text-primary"
					/>
				)}

				{trackingOn && (
					<MessageStatsCard
						label={__('Total Sent Emails', 'doublescale')}
						value={data.total_sent_emails || 0}
						icon={<ContactTotalEmailsIcon width={40} height={40} />}
						iconBgClass="bg-[#E3EEFF99]"
						borderColorClass="border-l-secondary"
						iconColor="text-secondary"
					/>
				)}

				{contactsOn && (
					<MessageStatsCard
						label={__('Total Tags', 'doublescale')}
						value={data.total_tags || 0}
						icon={<TagsIcon width={40} height={40} />}
						iconBgClass="bg-[#F5EFFF]"
						borderColorClass="border-l-[#660FF1]"
						iconColor="text-[#660FF1]"
					/>
				)}

				{contactsOn && (
					<MessageStatsCard
						label={__('Total Lists', 'doublescale')}
						value={data.total_lists || 0}
						icon={<ListsIcon width={40} height={40} />}
						iconBgClass="bg-[#E8F5E9]"
						borderColorClass="border-l-[#4CAF50]"
						iconColor="text-[#4CAF50]"
					/>
				)}

				{automationsOn && (
					<MessageStatsCard
						label={__('Active Automation', 'doublescale')}
						value={data.total_automations || 0}
						icon={<AutomationsIcon width={40} height={40} />}
						iconBgClass="bg-[#FAEADF]"
						borderColorClass="border-l-[#CB5301]"
						iconColor="text-[#CB5301]"
					/>
				)}

				{dealsOn && (
					<MessageStatsCard
						label={__('Total Deals', 'doublescale')}
						value={data.deals || 0}
						icon={<DealsIcon width={40} height={40} />}
						iconBgClass="bg-[#FAF3DF]"
						borderColorClass="border-l-[#A67D0A]"
						iconColor="text-[#A67D0A]"
					/>
				)}

				{dealsOn && (
					<MessageStatsCard
						label={__('Deals Closed Won ', 'doublescale')}
						value={data.deals_closed_won || 0}
						icon={<DealsClosedWonIcon width={40} height={40} />}
						iconBgClass="bg-[#E4FAEC]"
						borderColorClass="border-l-[#16A34A]"
						iconColor="text-[#16A34A]"
					/>
				)}

				{dealsOn && (
					<MessageStatsCard
						label={__('Deals Won Value', 'doublescale')}
						value={data.deals_won_value || 0}
						icon={<DealsWonValueIcon width={40} height={40} />}
						iconBgClass="bg-[#E4FAEC]"
						borderColorClass="border-l-[#16A34A]"
						iconColor="text-[#16A34A]"
					/>
				)}
			</div>
		</DashboardContentCard>
	);
};
