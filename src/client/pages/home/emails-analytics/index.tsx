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
import type { DashboardData } from '@quillcrm/client';
import { EmailStatsCards } from './email-stats-cards';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentEmailsTable } from './recent-emails-list';
import { useEmailAnalytics } from '../use-analytics';

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
			<EmailStatsCards data={data} />

			<RecentEmailsTable emails={dashboardData.recent_emails} />

			{/* You can add date filter and chart here if needed */}
		</div>
	);
};

export default EmailAnalytics;
