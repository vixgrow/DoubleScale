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
import { map } from 'lodash';
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
import { Line } from 'react-chartjs-2';

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
	DashboardData,
	EmailsAnalytics as EmailAnalyticsData,
} from '@quillcrm/client';
import { EmailStatsCards } from './email-stats-cards';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentEmailsTable } from './recent-emails-list';

interface EmailAnalyticsProps {
	EmailsData: DashboardData['recent_emails'];
}

const EmailAnalytics: React.FC<EmailAnalyticsProps> = ({ EmailsData }) => {
	const [data, setData] = useState<EmailAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [interval, setInterval] = useState<string>('today');
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(new Date());
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchEmailAnalytics = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/campaigns/email-analytics', {
					interval,
					start_date: dayjs(startDate).format('YYYY-MM-DD'),
					end_date: dayjs(endDate).format('YYYY-MM-DD'),
				}),
			})) as EmailAnalyticsData;

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
		fetchEmailAnalytics();
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
			<EmailStatsCards data={data} />

			<RecentEmailsTable emails={EmailsData} />

			{/* <DateFilter
				interval={interval}
				startDate={startDate}
				endDate={endDate}
				onIntervalChange={(value) => setInterval(value)}
				onChangeFromDate={(date) => setStartDate(date)}
				onChangeToDate={(date) => setEndDate(date)}
				onSubmit={fetchEmailAnalytics}
			/>
			<Flex gap={20}>
				<Card
					title={__('Email Analytics', 'quillcrm')}
					extra={
						<NavLink to="campaigns">
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
									label: __('Emails', 'quillcrm'),
									data: map(data.data.dates, (date) => {
										return data.emails[date]
											? data.emails[date]
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
									max: parseInt(data.total) + 10,
								},
							},
							plugins: {
								tooltip: {
									callbacks: {
										label: function (context) {
											return `Date: ${convertDate(data.data.dates[context.dataIndex])}`;
										},
										title: function (context) {
											return `Emails: ${data.emails[data.data.dates[context[0].dataIndex]]}`;
										},
									},
								},
							},
						}}
						height={70}
					/>
				</Card>
			</Flex> */}
		</div>
	);
};

export default EmailAnalytics;
