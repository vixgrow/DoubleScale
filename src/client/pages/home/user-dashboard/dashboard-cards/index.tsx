/**
 * wordpress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

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
	TaskDoneIcon,
} from '@doublescale/components';
import type { DashboardData } from '@doublescale/client';
import config from '@doublescale/config';
import { getGlobalCurrency } from '@/constants/currencies';

interface DashboardCardsProps {
	data: DashboardData;
}

const formatStatCount = (n: number) => n.toLocaleString();

const formatDealsWonValue = (n: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency,
		notation: 'compact',
		maximumFractionDigits: 1,
	}).format(n);

const formatDealsWonBreakdown = (
	byCurrency: Record<string, number> | undefined,
	fallback: number
): string => {
	const entries = Object.entries(byCurrency ?? {}).filter(([, amount]) => amount !== 0);
	if (entries.length === 0) {
		return formatDealsWonValue(fallback, getGlobalCurrency());
	}
	entries.sort((a, b) => b[1] - a[1]);
	const [topCode, topAmount] = entries[0];
	const extra = entries.length - 1;
	if (extra <= 0) {
		return formatDealsWonValue(topAmount, topCode);
	}
	return `${formatDealsWonValue(topAmount, topCode)} ${sprintf(
		_n('+%d more currency', '+%d more currencies', extra, 'doublescale'),
		extra
	)}`;
};

export const DashboardCards: React.FC<DashboardCardsProps> = ({ data }) => {
	const isProActive = applyFilters('doublescale_is_pro_active', false) as boolean;
	const dealsModuleEnabled = config.isModuleToggleEnabled('deals');
	const projectsModuleEnabled = config.isModuleToggleEnabled('projects');

	return (
		<DashboardContentCard
			title={__('Analytics Overview', 'doublescale')}
			cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]"
			contentClassName="flex min-h-0 flex-1 flex-col"
		>
			<div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-6">
				<MessageStatsCard
					layout="centered"
					className="bg-[#F7F8FA]"
					label={__('Total Contacts', 'doublescale')}
					value={formatStatCount(data.total_contacts || 0)}
					icon={<ContactsIcon width={29} height={29} />}
					iconBgClass="bg-[#CB5301]"
					iconColor="text-white"
				/>

				<MessageStatsCard
					layout="centered"
					className="bg-[#F7F8FA]"
					label={__('Total Sent Emails', 'doublescale')}
					value={formatStatCount(data.total_sent_emails || 0)}
					icon={<ContactTotalEmailsIcon width={29} height={29} />}
					iconBgClass="bg-[#0D9DFC]"
					iconColor="text-white"
				/>

				<MessageStatsCard
					layout="centered"
					className="bg-[#F7F8FA]"
					label={__('Total Tags', 'doublescale')}
					value={formatStatCount(data.total_tags || 0)}
					icon={<TagsIcon width={29} height={29} />}
					iconBgClass="bg-[#FFD242]"
					iconColor="text-primaryText"
				/>

				<MessageStatsCard
					layout="centered"
					className="bg-[#F7F8FA]"
					label={__('Total Lists', 'doublescale')}
					value={formatStatCount(data.total_lists || 0)}
					icon={<ListsIcon width={29} height={29} />}
					iconBgClass="bg-[#262666]"
					iconColor="text-white"
				/>

				<MessageStatsCard
					layout="centered"
					className="bg-[#F7F8FA]"
					label={__('Active Automation', 'doublescale')}
					value={formatStatCount(data.total_automations || 0)}
					icon={<AutomationsIcon width={29} height={29} />}
					iconBgClass="bg-brandPrimary"
					iconColor="text-white"
				/>

				{dealsModuleEnabled && isProActive && (
					<MessageStatsCard
						layout="centered"
						className="bg-[#F7F8FA]"
						label={__('Total Deals', 'doublescale')}
						value={formatStatCount(data.deals || 0)}
						icon={<DealsIcon width={29} height={29} />}
						iconBgClass="bg-[#0D9DFC]"
						iconColor="text-white"
					/>
				)}

				{dealsModuleEnabled && isProActive && (
					<MessageStatsCard
						layout="centered"
						className="bg-[#F7F8FA]"
						label={__('Deals Closed Won', 'doublescale')}
						value={formatStatCount(data.deals_closed_won || 0)}
						icon={<DealsClosedWonIcon width={29} height={29} />}
						iconBgClass="bg-[#16A34A]"
						iconColor="text-white"
					/>
				)}

				{dealsModuleEnabled && isProActive && (
					<MessageStatsCard
						layout="centered"
						className="bg-[#F7F8FA]"
						label={__('Deals Won Value', 'doublescale')}
						value={formatDealsWonBreakdown(
							data.deals_won_value_by_currency,
							data.deals_won_value || 0
						)}
						icon={<DealsWonValueIcon width={29} height={29} />}
						iconBgClass="bg-[#16A34A]"
						iconColor="text-white"
					/>
				)}

				{projectsModuleEnabled && isProActive && (
					<MessageStatsCard
						layout="centered"
						className="bg-[#F7F8FA]"
						label={__('Total Projects', 'doublescale')}
						value={formatStatCount(data.projects || 0)}
						icon={<TaskDoneIcon width={29} height={29} />}
						iconBgClass="bg-[#8775EC]"
						iconColor="text-white"
					/>
				)}
			</div>
		</DashboardContentCard>
	);
};
