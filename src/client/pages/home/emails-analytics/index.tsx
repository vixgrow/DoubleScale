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
} from 'chart.js';

ChartJS.register(
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	Title,
	CategoryScale,
	Tooltip,
	BarElement
);

/**
 * Internal dependencies
 */
import './style.scss';
import type { DashboardData } from '@doublescale/client';
import { EmailStatsCards } from './email-stats-cards';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentEmailsTable } from './recent-emails-list';
import { useEmailAnalytics } from '../use-analytics';
import { DashboardContentCard, PageHeader } from '@doublescale/components';
import EmailAnalyticsSkeleton from './EmailAnalyticsSkeleton';

interface EmailAnalyticsProps {
	dashboardData: DashboardData;
}

const EmailAnalytics: React.FC<EmailAnalyticsProps> = ({ dashboardData }) => {
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
	} = useEmailAnalytics();

	if (!data || loading) {
		return(<EmailAnalyticsSkeleton />);
	}

	return (
		<>
			<PageHeader
				title={__('Emails Analytics', 'doublescale')}
				subtitle={__('Emails Analytics', 'doublescale')}
				actions={[]}
			/>
			<div className="flex flex-col gap-5">
				<DashboardContentCard title={__('Emails Analytics Overview', 'doublescale')}>
				<EmailStatsCards data={data} />
				</DashboardContentCard>
				

				<RecentEmailsTable emails={dashboardData.recent_emails} />
			</div>
		</>
	);
};

export default EmailAnalytics;
