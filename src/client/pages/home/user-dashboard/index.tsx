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
import { useContactAnalytics } from '../use-analytics';
import config from '@doublescale/config';
// import { applyFilters } from '@wordpress/hooks'; // Uncomment when cart analytics is enabled

interface UserDashboardProps {
	dashboardData: DashboardData;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ dashboardData }) => {
	const contactsOn = config.isModuleToggleEnabled('contacts');
	const automationsOn = config.isModuleToggleEnabled('automations');
	const campaignsOn = config.isModuleToggleEnabled('campaigns');

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

	if (contactsOn && !contactsData) {
		return <UserDashboardShimmer />;
	}

	return (
		<div className="flex flex-col gap-5 mt-5">
			<DashboardCards data={dashboardData} />
			{contactsOn && contactsData && (
				<div className="flex gap-5">
					<RecentContactsList contacts={dashboardData.recent_contacts} />
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
			)}

			<div className="flex gap-5">
				{automationsOn && (
					<RecentAutomationsTable
						automations={dashboardData.top_automations}
					/>
				)}
				<QuickLinks stretch={!automationsOn} />
			</div>

			{campaignsOn && (
				<div className="flex gap-5">
					<RecentCampaignsTable campaigns={dashboardData.top_campaigns} />
					{/* <CartsChart
					data={cartsData}
					interval={cartsInterval}
					startDate={cartsStartDate}
					endDate={cartsEndDate}
					onIntervalChange={setCartsInterval}
					onChangeFromDate={setCartsStartDate}
					onChangeToDate={setCartsEndDate}
					onSubmit={refetchCarts}
				/> */}
				</div>
			)}
		</div>
	);
};

export default UserDashboard;
