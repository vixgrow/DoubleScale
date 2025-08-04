/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import dayjs from 'dayjs';
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
import type {
	ContactAnalytics as ContactAnalyticsData,
	DashboardData,
} from '@quillcrm/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactStatsCards } from './contacts-stats-card';
import { RecentContactsList } from './recent-contacts-list';
import { ContactAnalyticsChart } from './contacts-chart';
import { UnsubscribedContactsTable } from './unsubscribed-contacts-list';

interface ContactAnalyticsProps {
	ContactsData: DashboardData;
}

const ContactAnalytics: React.FC<ContactAnalyticsProps> = ({
	ContactsData,
}) => {
	const [data, setData] = useState<ContactAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [interval, setInterval] = useState<string>('today');
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(new Date());
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchContactAnalytics = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts/analytics', {
					interval,
					start_date: dayjs(startDate).format('YYYY-MM-DD'),
					end_date: dayjs(endDate).format('YYYY-MM-DD'),
				}),
			})) as ContactAnalyticsData;

			setData(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Error fetching analytics data', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchContactAnalytics();
	}, []);

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
			<ContactStatsCards data={data} />

			<div className="flex gap-5">
				<RecentContactsList contacts={ContactsData.recent_contacts} />
				<ContactAnalyticsChart
					data={data}
					interval={interval}
					startDate={startDate}
					endDate={endDate}
					onIntervalChange={setInterval}
					onChangeFromDate={setStartDate}
					onChangeToDate={setEndDate}
					onSubmit={fetchContactAnalytics}
				/>
			</div>

			<UnsubscribedContactsTable
				contacts={ContactsData.recent_unsubscribed_contacts}
			/>
		</div>
	);
};

export default ContactAnalytics;
