/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Card, Flex, Typography, Spin } from 'antd';
import {
	SendOutlined,
	EyeOutlined,
	LinkOutlined,
	UserOutlined,
} from '@ant-design/icons';
import { Chart } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	ArcElement,
	DoughnutController,
	Tooltip,
	Legend,
	Title,
} from 'chart.js';

ChartJS.register(ArcElement, DoughnutController, Tooltip, Legend, Title);

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignContext } from '../../state/context';
import { Campaign as CampaignType } from '@quillcrm/client';

const Analytics: React.FC = () => {
	const { campaign, isLoading, updateCampaign } = useCampaignContext();
	const [isFetching, setIsFetching] = useState(false);
	const fetchCampaign = async () => {
		if (!campaign || isFetching) {
			return;
		}

		setIsFetching(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${campaign.id}`,
			})) as CampaignType;

			updateCampaign(response);
		} catch (error) {
			console.error(error);
		} finally {
			setIsFetching(false);
		}
	};

	// @ts-ignore
	useEffect(() => {
		if (campaign && campaign.status === 'processing') {
			let timeout = setTimeout(fetchCampaign, 5000);

			return () => {
				clearTimeout(timeout);
			};
		}
	}, [campaign]);

	return (
		<Card
			loading={isLoading}
			title={
				<Flex justify="space-between">
					<Typography.Title level={4} style={{ margin: 0 }}>
						{__('Analytics')}
					</Typography.Title>
					<Flex gap={10}>
						<Typography.Text>{campaign?.status}</Typography.Text>
						{campaign?.status === 'processing' && <Spin />}
					</Flex>
				</Flex>
			}
		>
			{campaign && (
				<Flex gap={20} vertical>
					<Flex gap={20}>
						<Card style={{ flex: 1 }}>
							<Flex vertical={true} gap={10}>
								<Flex gap={10}>
									<UserOutlined />
									<Typography.Text strong>
										{__('Contacts')}
									</Typography.Text>
								</Flex>
								<Typography.Text className="qcrm-analytics-count">
									{campaign.contacts_count}
								</Typography.Text>
							</Flex>
						</Card>
						<Card style={{ flex: 1 }}>
							<Flex vertical={true} gap={10}>
								<Flex gap={10}>
									<SendOutlined />
									<Typography.Text strong>
										{__('Sent')}
									</Typography.Text>
								</Flex>
								<Typography.Text className="qcrm-analytics-count">
									{campaign.sent_count}
								</Typography.Text>
							</Flex>
						</Card>
						<Card style={{ flex: 1 }}>
							<Flex vertical={true} gap={10}>
								<Flex gap={10}>
									<EyeOutlined />
									<Typography.Text strong>
										{__('Opened')}
									</Typography.Text>
								</Flex>
								<Typography.Text className="qcrm-analytics-count">
									{campaign.opened_count}
								</Typography.Text>
							</Flex>
						</Card>
						<Card style={{ flex: 1 }}>
							<Flex vertical={true} gap={10}>
								<Flex gap={10}>
									<LinkOutlined />
									<Typography.Text strong>
										{__('Clicked')}
									</Typography.Text>
								</Flex>
								<Typography.Text className="qcrm-analytics-count">
									{campaign.clicked_count}
								</Typography.Text>
							</Flex>
						</Card>
					</Flex>
					<Card>
						<Flex justify="center">
							<div style={{ maxWidth: 400 }}>
								<Chart
									type="doughnut"
									data={{
										labels: [
											__('Sent', 'quillcrm'),
											__('Opened', 'quillcrm'),
											__('Clicked', 'quillcrm'),
										],
										datasets: [
											{
												data: [
													campaign.sent_count,
													campaign.opened_count,
													campaign.clicked_count,
												],
												backgroundColor: [
													'#1890ff',
													'#52c41a',
													'#faad14',
												],
											},
										],
									}}
									options={{
										responsive: true,
										plugins: {
											legend: {
												display: false,
												maxHeight: 300,
												maxWidth: 300,
											},
										},
									}}
								/>
							</div>
						</Flex>
					</Card>
				</Flex>
			)}
		</Card>
	);
};

export default Analytics;
