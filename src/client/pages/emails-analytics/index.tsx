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
import { Card, Flex, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { MailOutlined, EyeOutlined, LinkOutlined } from '@ant-design/icons';
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
import type { EmailsAnalytics as EmailAnalyticsData } from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { convertDate, formatDate } from '@quillcrm/utils';
import { DateFilter } from '@quillcrm/components';

const EmailAnalytics: React.FC = () => {
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
		return <Skeleton active />;
	}

	return (
		<Flex gap={20} vertical>
			<Flex gap={20}>
				<Card className="qcrm-dashboard-card">
					<Flex gap={10} vertical>
						<Flex gap={10}>
							<div className="qcrm-dashboard-card-icon">
								<MailOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Sent', 'quillcrm')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="qcrm-dashboard-card-value">
							{data.total}
						</Typography.Text>
					</Flex>
				</Card>
				<Card className="qcrm-dashboard-card">
					<Flex gap={10} vertical>
						<Flex gap={10}>
							<div className="qcrm-dashboard-card-icon">
								<EyeOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Opened', 'quillcrm')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="qcrm-dashboard-card-value">
							{data.total_opened || 0}
						</Typography.Text>
					</Flex>
				</Card>
				<Card className="qcrm-dashboard-card">
					<Flex gap={10} vertical>
						<Flex gap={10}>
							<div className="qcrm-dashboard-card-icon">
								<LinkOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Clicked', 'quillcrm')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="qcrm-dashboard-card-value">
							{data.total_clicked || 0}
						</Typography.Text>
					</Flex>
				</Card>
			</Flex>
			<DateFilter
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
			</Flex>
		</Flex>
	);
};

export default EmailAnalytics;
