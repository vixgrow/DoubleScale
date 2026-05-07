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
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { map } from 'lodash';
import '../../lib/chart-setup';
import { Line } from 'react-chartjs-2';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CartAnalytics as CartAnalyticsData } from '@doublescale/client';
import { NavLink } from '@doublescale/navigation';
import { convertDate, formatDate } from '@doublescale/utils';
import { DateFilter } from '@doublescale/components';

const CartAnalytics: React.FC = () => {
	const [data, setData] = useState<CartAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [interval, setInterval] = useState<string>('today');
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(new Date());
	const { createNotice } = useDispatch('doublescale/core');

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
				message: __('Error fetching analytics data', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCartAnalytics();
	}, []);

	if (!data || loading) {
		return <Skeleton active />;
	}

	return (
		<Flex gap={20} vertical>
			<Flex gap={20}>
				<Card className="doublescale-dashboard-card">
					<Flex gap={10} vertical>
						<Flex gap={10}>
							<div className="doublescale-dashboard-card-icon">
								<UserOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Carts', 'doublescale')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="doublescale-dashboard-card-value">
							{data.total.carts}
						</Typography.Text>
					</Flex>
				</Card>
				<Card className="doublescale-dashboard-card">
					<Flex gap={10} vertical>
						<Flex gap={10}>
							<div className="doublescale-dashboard-card-icon">
								<MailOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Revenue', 'doublescale')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="doublescale-dashboard-card-value">
							{data.total.revenue}
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
				onSubmit={fetchCartAnalytics}
			/>
			<Flex gap={20}>
				<Card
					title={__('Cart Analytics', 'doublescale')}
					extra={
						<NavLink to="abandoned-carts">
							{__('View All', 'doublescale')}
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
									label: __('Carts', 'doublescale'),
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
					title={__('Revenue', 'doublescale')}
					extra={
						<NavLink to="abandoned-carts">
							{__('View All', 'doublescale')}
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
									label: __('Revenue', 'doublescale'),
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
			</Flex>
		</Flex>
	);
};

export default CartAnalytics;
