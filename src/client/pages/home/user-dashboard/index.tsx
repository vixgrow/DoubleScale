/**
 * external dependencies
 */
import {
	Chart as ChartJS,
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	Title,
	CategoryScale,
	Tooltip,
	BarElement,
	Filler,
} from 'chart.js';

ChartJS.register(
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	Title,
	CategoryScale,
	Tooltip,
	BarElement,
	Filler
);

/**
 * Internal dependencies
 */
import type { DashboardData } from '@doublescale/client';
import { DashboardCards } from './dashboard-cards';
import { RecentContactsList } from '../recent-contacts-list';
import { ContactAnalyticsChart } from '../contacts-chart';
import { RecentAutomationsTable } from './recent-automations';
import { QuickLinks } from './quick-links';
import { RecentCampaignsTable } from './RecentCampaignsTable';
import { UserDashboardShimmer } from './UserDashboardShimmer';
import { MobileAppCard } from './mobile-app-card';
import { useContactAnalytics } from '../use-analytics';
import config from '@doublescale/config';
import { cn } from '@/lib/utils';

interface UserDashboardProps {
	dashboardData: DashboardData;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ dashboardData }) => {
	const contactsOn = config.isModuleToggleEnabled('contacts');
	const automationsOn = config.isModuleToggleEnabled('automations');
	const campaignsOn = config.isModuleToggleEnabled('campaigns');
	const showQuickLinks =
		config.isModuleToggleEnabled('contacts') ||
		config.isModuleToggleEnabled('deals') ||
		config.isModuleToggleEnabled('campaigns') ||
		config.isModuleToggleEnabled('automations') ||
		config.isModuleToggleEnabled('forms');

	const {
		data: contactsData,
		loading: contactsLoading,
		interval: contactsInterval,
		startDate: contactsStartDate,
		endDate: contactsEndDate,
		setInterval: setContactsInterval,
		setStartDate: setContactsStartDate,
		setEndDate: setContactsEndDate,
		refetch: refetchContacts,
	} = useContactAnalytics();

	if (contactsOn && !contactsData) {
		return <UserDashboardShimmer />;
	}

	return (
		<div className="flex flex-col gap-6">
			<MobileAppCard />
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
				<div
					className={cn(
						'h-full min-h-0',
						showQuickLinks ? 'lg:col-span-2' : 'lg:col-span-3'
					)}
				>
					<DashboardCards data={dashboardData} />
				</div>
				{showQuickLinks && (
					<div className="flex h-full min-h-0 flex-col lg:col-span-1">
						<QuickLinks />
					</div>
				)}
			</div>

			{contactsOn && contactsData && (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
					<div className="flex h-full min-h-0 flex-col">
						<RecentContactsList contacts={dashboardData.recent_contacts} />
					</div>
					<div className="flex h-full min-h-0 flex-col">
						<ContactAnalyticsChart
							data={contactsData}
							loading={contactsLoading}
							interval={contactsInterval}
							startDate={contactsStartDate}
							endDate={contactsEndDate}
							onIntervalChange={setContactsInterval}
							onChangeFromDate={setContactsStartDate}
							onChangeToDate={setContactsEndDate}
							onSubmit={refetchContacts}
						/>
					</div>
				</div>
			)}

			{(automationsOn || campaignsOn) && (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
					{automationsOn && (
						<div className="flex h-full min-h-0 flex-col">
							<RecentAutomationsTable
								automations={dashboardData.top_automations}
							/>
						</div>
					)}
					{campaignsOn && (
						<div className="flex h-full min-h-0 flex-col">
							<RecentCampaignsTable
								campaigns={dashboardData.top_campaigns}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default UserDashboard;
