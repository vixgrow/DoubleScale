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
import { UserOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { map } from 'lodash';
import '../../lib/chart-setup';
import { Line } from 'react-chartjs-2';

/**
 * Internal dependencies
 */
import './style.scss';
import type { ContactAnalytics as ContactAnalyticsData } from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { convertDate, formatDate } from '@quillcrm/utils';
import { DateFilter } from '@quillcrm/components';

const ContactAnalytics: React.FC = () => {
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
		return <Skeleton active />;
	}

	return (
		<Flex gap={20} vertical>
			<Flex gap={20}>
				<Card className="qcrm-dashboard-card">
					<Flex gap={10} vertical>
						<Flex gap={10}>
							<div className="qcrm-dashboard-card-icon">
								<UserOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Contacts', 'quillcrm')}
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
								<UserOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Subscribers', 'quillcrm')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="qcrm-dashboard-card-value">
							{data.total_subscribed}
						</Typography.Text>
					</Flex>
				</Card>
				<Card className="qcrm-dashboard-card">
					<Flex gap={10} vertical>
						<Flex gap={10}>
							<div className="qcrm-dashboard-card-icon">
								<UserDeleteOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Unsubscribers', 'quillcrm')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="qcrm-dashboard-card-value">
							{data.total_unsubscribed}
						</Typography.Text>
					</Flex>
				</Card>
			</Flex>
			<Flex gap={20} align="flex-end">
				<DateFilter
					interval={interval}
					startDate={startDate}
					endDate={endDate}
					onIntervalChange={(value) => setInterval(value)}
					onChangeFromDate={(date) => setStartDate(date)}
					onChangeToDate={(date) => setEndDate(date)}
					onSubmit={fetchContactAnalytics}
				/>
			</Flex>
			<Flex gap={20}>
				<Card
					title={__('Contact Analytics', 'quillcrm')}
					extra={
						<NavLink to="contacts">
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
									label: __('Contacts', 'quillcrm'),
									data: map(data.data.dates, (date) => {
										return data.contacts[date]
											? data.contacts[date]
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
											return `Contacts: ${data.contacts[data.data.dates[context[0].dataIndex]]}`;
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

export default ContactAnalytics;
