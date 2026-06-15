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
import { ContactStatsCards } from './contacts-stats-card';
import { RecentContactsList } from '../recent-contacts-list';
import { ContactAnalyticsChart } from '../contacts-chart';
import { UnsubscribedContactsTable } from './unsubscribed-contacts-list';
import { useContactAnalytics } from '../use-analytics';
import { DashboardContentCard, PageHeader } from '@doublescale/components';
import { Button } from '@/components/ui/button';
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

	if (loading && !data) {
		return <ContactAnalyticsSkeleton />;
	}

	if (!data) {
		return (
			<>
				<PageHeader
					title={__('Contacts Analytics', 'doublescale')}
					subtitle={__('Contacts Analytics', 'doublescale')}
					actions={[]}
				/>
				<div className="flex flex-col items-center justify-center gap-4 px-6 py-16">
					<p className="text-center text-muted-foreground">
						{__(
							'Could not load analytics. Check your connection or try again.',
							'doublescale'
						)}
					</p>
					<Button type="button" onClick={() => void refetch()}>
						{__('Try again', 'doublescale')}
					</Button>
				</div>
			</>
		);
	}

	return (
		<>
			<PageHeader
				title={__('Contacts Analytics', 'doublescale')}
				subtitle={__('Contacts Analytics', 'doublescale')}
				actions={[]}
			/>
			<div className="flex flex-col gap-5">
				<div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-stretch">
					<div className="flex h-full min-h-0 flex-col lg:col-span-1">
						<DashboardContentCard
							title={__('Contacts Analytics Overview', 'doublescale')}
							cardClassName="h-full"
						>
							<ContactStatsCards data={data} />
						</DashboardContentCard>
					</div>
					<div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-auto lg:col-span-2">
						<UnsubscribedContactsTable
							contacts={dashboardData.recent_unsubscribed_contacts}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
					<div className="flex h-full min-h-0 flex-col">
						<RecentContactsList contacts={dashboardData.recent_contacts} />
					</div>
					<div className="flex h-full min-h-0 flex-col">
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
				</div>
			</div>
		</>
	);
};

export default ContactAnalytics;
