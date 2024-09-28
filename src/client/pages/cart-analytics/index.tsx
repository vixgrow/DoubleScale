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
import type { CartAnalytics as CartAnalyticsData } from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';

const CartAnalytics: React.FC = () => {
	const [data, setData] = useState<CartAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchCartAnalytics = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/abandoned-carts/analytics'),
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

	useEffect(() => {
		fetchCartAnalytics();
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
								{__('Total Carts', 'quillcrm')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="qcrm-dashboard-card-value">
							{data.total.carts}
						</Typography.Text>
					</Flex>
				</Card>
				<Card className="qcrm-dashboard-card">
					<Flex gap={10} vertical>
						<Flex gap={10}>
							<div className="qcrm-dashboard-card-icon">
								<MailOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Revenue', 'quillcrm')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="qcrm-dashboard-card-value">
							{data.total.revenue}
						</Typography.Text>
					</Flex>
				</Card>
			</Flex>
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
							labels: map(data.dates.days, (date) => {
								const newDate = new Date(date);
								return newDate.getDate();
							}),
							datasets: [
								{
									label: __('Carts', 'quillcrm'),
									data: map(data.dates.days, (date) => {
										return data.carts[date]
											? data.carts[date].length
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
							labels: map(data.dates.days, (date) => {
								const newDate = new Date(date);
								return newDate.getDate();
							}),
							datasets: [
								{
									label: __('Revenue', 'quillcrm'),
									data: map(data.dates.days, (date) => {
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
						}}
						height={100}
					/>
				</Card>
			</Flex>
		</Flex>
	);
};

export default CartAnalytics;
