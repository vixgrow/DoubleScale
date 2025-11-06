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
import type { DashboardData } from '@quillcrm/client';
import ConfigAPI from '@quillcrm/config';
import { DashboardCards } from './dashboard-cards';
import { RecentContactsList } from '../recent-contacts-list';
import { ContactAnalyticsChart } from '../contacts-chart';
import { RecentAutomationsTable } from './recent-automations';
import { QuickLinks } from './quick-links';
import { RecentCampaignsTable } from './RecentCampaignsTable';
import { CartsChart } from '../cart-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useContactAnalytics, useCartAnalytics } from '../use-analytics';

interface UserDashboardProps {
	dashboardData: DashboardData;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ dashboardData }) => {
	const isWooCommerceActive = ConfigAPI.isWoocommerceActive();

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

	const {
		data: cartsData,
		loading: cartsLoading,
		interval: cartsInterval,
		startDate: cartsStartDate,
		endDate: cartsEndDate,
		setInterval: setCartsInterval,
		setStartDate: setCartsStartDate,
		setEndDate: setCartsEndDate,
		refetch: refetchCarts,
	} = useCartAnalytics();

	if (!contactsData || !cartsData || contactsLoading || cartsLoading) {
		return (
			<div className="space-y-4 p-4">
				<Skeleton className="h-6 w-1/3" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
				<Skeleton className="h-4 w-4/6" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5 mt-5">
			<DashboardCards data={dashboardData} />
			<div className="flex gap-5">
				<RecentContactsList contacts={dashboardData.recent_contacts} />
				<ContactAnalyticsChart
					data={contactsData}
					interval={contactsInterval}
					startDate={contactsStartDate}
					endDate={contactsEndDate}
					onIntervalChange={setContactsInterval}
					onChangeFromDate={setContactsStartDate}
					onChangeToDate={setContactsEndDate}
					onSubmit={refetchContacts}
				/>
			</div>

			<div className="flex gap-5">
				<RecentAutomationsTable automations={dashboardData.top_automations} />
				<QuickLinks />
			</div>

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
		</div>
	);
};

export default UserDashboard;