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
	MyTemplatesIcon,
} from '@quillcrm/components';
import type { DashboardData } from '@quillcrm/client';

interface DashboardCardsProps {
	data: DashboardData;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ data }) => {
	return (
		<DashboardContentCard
			title={__('Analytics Overview', 'quillcrm')}
			cardClassName="w-full"
		>
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
				<MessageStatsCard
					label={__('Total Contacts', 'quillcrm')}
					value={data.total_contacts || 0}
					icon={<ContactsIcon width={40} height={40} />}
					iconBgClass="bg-[#E3EEFF99]"
					borderColorClass="border-l-primary"
					iconColor="text-primary"
				/>

				<MessageStatsCard
					label={__('Total Sent Emails', 'quillcrm')}
					value={data.total_sent_emails || 0}
					icon={<ContactTotalEmailsIcon width={40} height={40} />}
					iconBgClass="bg-[#E3EEFF99]"
					borderColorClass="border-l-secondary"
					iconColor="text-secondary"
				/>

				<MessageStatsCard
					label={__('Total Tags', 'quillcrm')}
					value={data.total_tags || 0}
					icon={<TagsIcon width={40} height={40} />}
					iconBgClass="bg-[#F5EFFF]"
					borderColorClass="border-l-[#660FF1]"
					iconColor="text-[#660FF1]"
				/>

				<MessageStatsCard
					label={__('Active Automation', 'quillcrm')}
					value={data.total_automations || 0}
					icon={<AutomationsIcon width={40} height={40} />}
					iconBgClass="bg-[#FAEADF]"
					borderColorClass="border-l-[#CB5301]"
					iconColor="text-[#CB5301]"
				/>

				<MessageStatsCard
					label={__('Total Deals', 'quillcrm')}
					value={data.deals || 0}
					icon={<DealsIcon width={40} height={40} />}
					iconBgClass="bg-[#E4EEFD]"
					borderColorClass="border-l-secondary"
					iconColor="text-secondary"
				/>

				<MessageStatsCard
					label={__('Deals Closed Won ', 'quillcrm')}
					value={data.deals_closed_won || 0}
					icon={<DealsClosedWonIcon width={40} height={40} />}
					iconBgClass="bg-[#E4FAEC]"
					borderColorClass="border-l-[#16A34A]"
					iconColor="text-[#16A34A]"
				/>

				<MessageStatsCard
					label={__('Deals Won Value', 'quillcrm')}
					value={data.deals_won_value || 0}
					icon={<DealsWonValueIcon width={40} height={40} />}
					iconBgClass="bg-[#E4FAEC]"
					borderColorClass="border-l-[#16A34A]"
					iconColor="text-[#16A34A]"
				/>
                
				<MessageStatsCard
					label={__('Email Templates', 'quillcrm')}
					value={data.total_email_templates || 0}
					icon={<MyTemplatesIcon width={36} height={36} />}
					iconBgClass="bg-[#FAF3DF]"
					borderColorClass="border-l-[#A67D0A]"
					iconColor="text-[#A67D0A]"
				/>
			</div>
		</DashboardContentCard>
	);
};
