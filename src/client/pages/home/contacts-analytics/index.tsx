/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
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
import './style.scss';
import type { DashboardData } from '@doublescale/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactStatsCards } from './contacts-stats-card';
import { RecentContactsList } from '../recent-contacts-list';
import { ContactAnalyticsChart } from '../contacts-chart';
import { UnsubscribedContactsTable } from './unsubscribed-contacts-list';
import { useContactAnalytics } from '../use-analytics';
import { DashboardContentCard, PageHeader } from '@doublescale/components';
import ContactAnalyticsSkeleton from './ContactAnalyticsSkeleton';

interface ContactAnalyticsProps {
	dashboardData: DashboardData;
}

const ContactAnalytics: React.FC<ContactAnalyticsProps> = ({
	dashboardData,
}) => {
	const {
		data,
		loading,
		interval,
		startDate,
		endDate,
		setInterval,
		setStartDate,
		setEndDate,
		refetch,
	} = useContactAnalytics();

	if (!data || loading) {
		return (<ContactAnalyticsSkeleton />);
	}

	return (
		<>
			<PageHeader
				title={__('Contacts Analytics', 'doublescale')}
				subtitle={__('Contacts Analytics', 'doublescale')}
				actions={[]}
			/>
			<div className="flex flex-col gap-5">

				<div className=' grid grid-cols-1 md:grid-cols-3 gap-5'>
					{/* <div className=' h-full col-span-1'>
				  <ContactStatsCards data={data} />
				</div> */}
					<DashboardContentCard
						title={__('Cart Analytics Overview', 'doublescale')}
						cardClassName='h-full col-span-1'
					>
						<ContactStatsCards data={data} />
					</DashboardContentCard>
					<div className=' h-full col-span-2'>
						<UnsubscribedContactsTable
							contacts={dashboardData.recent_unsubscribed_contacts}
						/>
					</div>

				</div>
				{/* <ContactStatsCards data={data} /> */}

				<div className="flex gap-5">
					<RecentContactsList contacts={dashboardData.recent_contacts} />
					<ContactAnalyticsChart
						data={data}
						interval={interval}
						startDate={startDate}
						endDate={endDate}
						onIntervalChange={setInterval}
						onChangeFromDate={setStartDate}
						onChangeToDate={setEndDate}
						onSubmit={refetch}
					/>
				</div>

				{/* <UnsubscribedContactsTable
				contacts={dashboardData.recent_unsubscribed_contacts}
			/> */}
			</div>
		</>
	);
};

export default ContactAnalytics;
