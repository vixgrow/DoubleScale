/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * internal dependencies
 */
import {
	DashboardContentCard,
	MessageStatsCard,
	ProStatCard,
	DealsWonValueIcon,
	DealsClosedWonIcon,
	ContactsIcon,
	ContactTotalEmailsIcon,
	TagsIcon,
	AutomationsIcon,
	DealsIcon,
	ListsIcon,
	PremiumIcon,
} from '@quillcrm/components';
import type { DashboardData } from '@quillcrm/client';

interface DashboardCardsProps {
	data: DashboardData;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ data }) => {
	// Check if Pro plugin is active via WordPress filter
	// Pro plugin will set this to true via addFilter('quillcrm_is_pro_active', ...)
	const isProActive = applyFilters('quillcrm_is_pro_active', false) as boolean;

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
					label={__('Total Lists', 'quillcrm')}
					value={data.total_lists || 0}
					icon={<ListsIcon width={40} height={40} />}
					iconBgClass="bg-[#E8F5E9]"
					borderColorClass="border-l-[#4CAF50]"
					iconColor="text-[#4CAF50]"
				/>

				<MessageStatsCard
					label={__('Active Automation', 'quillcrm')}
					value={data.total_automations || 0}
					icon={<AutomationsIcon width={40} height={40} />}
					iconBgClass="bg-[#FAEADF]"
					borderColorClass="border-l-[#CB5301]"
					iconColor="text-[#CB5301]"
				/>

				{/* Pro Feature: Total Deals - Show blurred if Pro not active */}
				{isProActive ? (
					<MessageStatsCard
						label={__('Total Deals', 'quillcrm')}
						value={data.deals || 0}
						icon={<DealsIcon width={40} height={40} />}
						iconBgClass="bg-[#FAF3DF]"
						borderColorClass="border-l-[#A67D0A]"
						iconColor="text-[#A67D0A]"
					/>
				) : (
					<ProStatCard
						label={__('Total Deals', 'quillcrm')}
						value={data.deals || 0}
						icon={<PremiumIcon width={35} height={35} />}
						iconBgClass="bg-[#FAEADF]"
						borderColorClass="border-l-[#A67D0A]"
						iconColor="text-[#CB5301]"
					/>
				)}

				{/* Pro Feature: Deals Closed Won - Show blurred if Pro not active */}
				{isProActive ? (
					<MessageStatsCard
						label={__('Deals Closed Won ', 'quillcrm')}
						value={data.deals_closed_won || 0}
						icon={<DealsClosedWonIcon width={40} height={40} />}
						iconBgClass="bg-[#E4FAEC]"
						borderColorClass="border-l-[#16A34A]"
						iconColor="text-[#16A34A]"
					/>
				) : (
					<ProStatCard
						label={__('Deals Closed Won ', 'quillcrm')}
						value={data.deals_closed_won || 0}
						icon={<PremiumIcon width={35} height={35} />}
						iconBgClass="bg-[#FAEADF]"
						borderColorClass="border-l-[#16A34A]"
						iconColor="text-[#CB5301]"
					/>
				)}

				{/* Pro Feature: Deals Won Value - Show blurred if Pro not active */}
				{isProActive ? (
					<MessageStatsCard
						label={__('Deals Won Value', 'quillcrm')}
						value={data.deals_won_value || 0}
						icon={<DealsWonValueIcon width={40} height={40} />}
						iconBgClass="bg-[#E4FAEC]"
						borderColorClass="border-l-[#16A34A]"
						iconColor="text-[#16A34A]"
					/>
				) : (
					<ProStatCard
						label={__('Deals Won Value', 'quillcrm')}
						value={data.deals_won_value || 0}
						icon={<PremiumIcon width={35} height={35} />}
						iconBgClass="bg-[#FAEADF]"
						borderColorClass="border-l-[#16A34A]"
						iconColor="text-[#CB5301]"
					/>
				)}
			</div>
		</DashboardContentCard>
	);
};
