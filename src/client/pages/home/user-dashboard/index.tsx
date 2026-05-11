/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
// import { applyFilters } from '@wordpress/hooks'; // Uncomment when cart analytics is enabled

interface UserDashboardProps {
	dashboardData: DashboardData;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ dashboardData }) => {
	// Use separate hooks for contact and cart analytics with their own state
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

	if (!contactsData) {
		return <UserDashboardShimmer />;
	}

	return (
		<div className="flex flex-col gap-6">
			<MobileAppCard />
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
				<div className="h-full min-h-0 lg:col-span-2">
					<DashboardCards data={dashboardData} />
				</div>
				<div className="flex h-full min-h-0 flex-col lg:col-span-1">
					<QuickLinks />
				</div>
			</div>

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

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
				<div className="flex h-full min-h-0 flex-col">
					<RecentAutomationsTable
						automations={dashboardData.top_automations}
					/>
				</div>
				<div className="flex h-full min-h-0 flex-col">
					<RecentCampaignsTable
						campaigns={dashboardData.top_campaigns}
					/>
				</div>
			</div>
		</div>
	);
};

export default UserDashboard;
