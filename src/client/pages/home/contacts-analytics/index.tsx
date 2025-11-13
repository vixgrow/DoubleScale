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
import type { DashboardData } from '@quillcrm/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactStatsCards } from './contacts-stats-card';
import { RecentContactsList } from '../recent-contacts-list';
import { ContactAnalyticsChart } from '../contacts-chart';
import { UnsubscribedContactsTable } from './unsubscribed-contacts-list';
import { useContactAnalytics } from '../use-analytics';
import { DashboardContentCard, PageHeader } from '@quillcrm/components';

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
		<>
			<PageHeader
				title={__('Contacts Analytics', 'quillcrm')}
				subtitle={__('Contacts Analytics', 'quillcrm')}
				actions={[]}
			/>
			<div className="flex flex-col gap-5">

				<div className=' grid grid-cols-1 md:grid-cols-3 gap-5'>
					{/* <div className=' h-full col-span-1'>
				  <ContactStatsCards data={data} />
				</div> */}
					<DashboardContentCard
						title={__('Cart Analytics Overview', 'quillcrm')}
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
