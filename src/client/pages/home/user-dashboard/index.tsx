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
import type {
	DashboardData,
	ContactAnalytics,
	CartAnalytics,
} from '@quillcrm/client';
import ConfigAPI from '@quillcrm/config';
import { DashboardCards } from './dashboard-cards';
import { RecentContactsList } from '../contacts-analytics/recent-contacts-list';
import { ContactAnalyticsChart } from '../contacts-analytics/contacts-chart';
import { RecentAutomationsTable } from './recent-automations';
import { QuickLinks } from './quick-links';
import { RecentCampaignsTable } from './RecentCampaignsTable';
import { CartsChart } from '../cart-analytics/cart-chart';
import { Skeleton } from '@/components/ui/skeleton';

interface UserDashboardProps {
	data: DashboardData;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ data }) => {
	const isWooCommerceActive = ConfigAPI.isWoocommerceActive();

	const [contactsData, setContactsData] = useState<ContactAnalytics | null>(
		null
	);
	const [cartsData, setCartsData] = useState<CartAnalytics | null>(null);
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
			})) as ContactAnalytics;

			setContactsData(response);
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

	const fetchCartAnalytics = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/abandoned-carts/analytics', {
					interval,
					start_date: dayjs(startDate).format('YYYY-MM-DD'),
					end_date: dayjs(endDate).format('YYYY-MM-DD'),
				}),
			})) as CartAnalytics;

			setCartsData(response);
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
		fetchCartAnalytics();
	}, []);

	if (!contactsData || !cartsData || loading) {
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
			<DashboardCards data={data} />
			<div className="flex gap-5">
				<RecentContactsList contacts={data.recent_contacts} />
				<ContactAnalyticsChart
					data={contactsData}
					interval={interval}
					startDate={startDate}
					endDate={endDate}
					onIntervalChange={setInterval}
					onChangeFromDate={setStartDate}
					onChangeToDate={setEndDate}
					onSubmit={fetchContactAnalytics}
				/>
			</div>

			<div className="flex gap-5">
				<RecentAutomationsTable automations={data.top_automations} />
				<QuickLinks />
			</div>

			<div className="flex gap-5">
				<RecentCampaignsTable campaigns={data.top_campaigns} />
				<CartsChart
					data={cartsData}
					interval={interval}
					startDate={startDate}
					endDate={endDate}
					onIntervalChange={setInterval}
					onChangeFromDate={setStartDate}
					onChangeToDate={setEndDate}
					onSubmit={fetchCartAnalytics}
				/>
			</div>
		</div>
	);
};

export default UserDashboard;
