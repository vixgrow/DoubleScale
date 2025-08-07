/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
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
import type {
	CartAnalytics as CartAnalyticsData,
	DashboardData,
} from '@quillcrm/client';
import { CartStatsCards } from './cart-stats-card';
import { RecoveredCartsTable } from './recovered-carts-list';
import { RecentCartsTable } from './recent-carts-list';
import { CartsChart } from './cart-chart';
import { Skeleton } from '@/components/ui/skeleton';

interface CartAnalyticsProps {
	CartData: DashboardData;
}

const CartAnalytics: React.FC<CartAnalyticsProps> = ({ CartData }) => {
	const [data, setData] = useState<CartAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [interval, setInterval] = useState<string>('today');
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(new Date());
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchCartAnalytics = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/abandoned-carts/analytics', {
					interval,
					start_date: dayjs(startDate).format('YYYY-MM-DD'),
					end_date: dayjs(endDate).format('YYYY-MM-DD'),
				}),
			})) as CartAnalyticsData;

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
	console.log(data)

	useEffect(() => {
		fetchCartAnalytics();
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
			<CartStatsCards data={data} total_orders={CartData.total_orders} />

			<RecoveredCartsTable
				recovered_carts={CartData.recent_recoverd_carts}
			/>
			<div className="flex gap-5">
				<RecentCartsTable carts={Object.values(data.carts).flat()} />
				<CartsChart
					data={data}
					interval={interval}
					startDate={startDate}
					endDate={endDate}
					onIntervalChange={setInterval}
					onChangeFromDate={setStartDate}
					onChangeToDate={setEndDate}
					onSubmit={fetchCartAnalytics}
				/>
			</div>

			{/* <DateFilter
				interval={interval}
				startDate={startDate}
				endDate={endDate}
				onIntervalChange={(value) => setInterval(value)}
				onChangeFromDate={(date) => setStartDate(date)}
				onChangeToDate={(date) => setEndDate(date)}
				onSubmit={fetchCartAnalytics}
			/>
			<Flex gap={20}>
				<Card
					title={__('Cart Analytics', 'quillcrm')}
					extra={
						<NavLink to="abandoned-carts">
							{__('View All', 'quillcrm')}
						</NavLink>
					}
					style={{ flex: 1 }}
				>
					<Line
						data={{
							labels: map(data.data.dates, (date) => {
								return formatDate(date, data.data.type);
							}),
							datasets: [
								{
									label: __('Carts', 'quillcrm'),
									data: map(data.data.dates, (date) => {
										return data.carts[date]
											? data.carts[date]
											: 0;
									}),
									borderColor: '#6d78d8',
									backgroundColor: '#6d78d8',
								},
							],
						}}
						options={{
							scales: {
								x: {
									grid: {
										display: false,
									},
								},
								y: {
									beginAtZero: true,
									max: data.total.carts + 10,
								},
							},
							plugins: {
								tooltip: {
									callbacks: {
										label: function (context) {
											return `Date: ${convertDate(data.data.dates[context.dataIndex])}`;
										},
										title: function (context) {
											return `Carts: ${data.carts[data.data.dates[context[0].dataIndex]]}`;
										},
									},
								},
							},
						}}
						height={100}
					/>
				</Card>
				<Card
					title={__('Revenue', 'quillcrm')}
					extra={
						<NavLink to="abandoned-carts">
							{__('View All', 'quillcrm')}
						</NavLink>
					}
					style={{ flex: 1 }}
				>
					<Line
						data={{
							labels: map(data.data.dates, (date) => {
								return formatDate(date, data.data.type);
							}),
							datasets: [
								{
									label: __('Revenue', 'quillcrm'),
									data: map(data.data.dates, (date) => {
										return data.revenue[date]
											? data.revenue[date]
											: 0;
									}),
									borderColor: '#6d78d8',
									backgroundColor: '#6d78d8',
									fill: false,
								},
							],
						}}
						options={{
							scales: {
								x: {
									grid: {
										display: false,
									},
								},
								y: {
									beginAtZero: true,
									max:
										parseInt(
											data.total.revenue.toString()
										) + 10,
								},
							},
							plugins: {
								tooltip: {
									callbacks: {
										label: function (context) {
											return `Date: ${convertDate(data.data.dates[context.dataIndex])}`;
										},
										title: function (context) {
											return `Revenue: ${data.revenue[data.data.dates[context[0].dataIndex]]}`;
										},
									},
								},
							},
						}}
						height={100}
					/>
				</Card>
			</Flex> */}
		</div>
	);
};

export default CartAnalytics;
