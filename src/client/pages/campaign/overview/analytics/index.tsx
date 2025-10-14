/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import {
	Card,
	Flex,
	Typography,
	Spin,
	Progress,
	Table,
	Divider,
	Button,
	Modal,
} from 'antd';
import {
	SendOutlined,
	EyeOutlined,
	LinkOutlined,
	UserOutlined,
	WarningOutlined,
	CheckCircleOutlined,
	ReadOutlined,
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
import { Campaign as CampaignType, Template } from '@quillcrm/client';
import { CAMPAIGN_CHANNEL, getCampaignChannelLabel } from '@/constants/campaign-channel';

const Analytics: React.FC = () => {
	const { campaign, isLoading, updateCampaign, saveCampaign } =
		useCampaignContext();
	const totalMessages = campaign
		? campaign.sent_count + campaign.failed_count
		: 0;
	const [isFetching, setIsFetching] = useState(false);
	const [started, setStarted] = useState(
		campaign?.status === 'processing' && totalMessages > 0
	);
	const [template, setTemplate] = useState<Template | null>(null);
	const [resending, setResending] = useState(false);

	const fetchCampaign = useCallback(async () => {
		if (!campaign || isFetching) {
			return;
		}

		setIsFetching(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${campaign.id}`,
			})) as CampaignType;

			const totalMessages = response.sent_count + response.failed_count;
			if (
				totalMessages > 0 &&
				!started &&
				totalMessages !== campaign.sent_count + campaign.failed_count
			) {
				setStarted(true);
			}

			updateCampaign(response);

			if (response.status === 'completed') {
				setStarted(false);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsFetching(false);
		}
	}, [campaign, isFetching, started, updateCampaign]);

	// @ts-ignore
	useEffect(() => {
		let timeout;
		if (
			campaign &&
			(campaign.status === 'processing' ||
				campaign.status === 'resending')
		) {
			timeout = setTimeout(fetchCampaign, 5000);
		}

		return () => {
			clearTimeout(timeout);
		};
	}, [campaign, fetchCampaign]);

	const resendFailed = async () => {
		if (!campaign) {
			return;
		}

		setResending(true);
		try {
			await saveCampaign({ status: 'resending' });
		} catch (error) {
			console.error(error);
		} finally {
			setResending(false);
		}
	};

	const calculatePercentage = (total: number, value: number) => {
		if (total === 0) {
			return 0;
		}

		return ((value / total) * 100).toFixed(2);
	};

	// Get campaign type-specific labels
	const getMessageTypeLabel = () => {
		switch (campaign?.type) {
			case CAMPAIGN_CHANNEL.EMAIL:
				return __('Emails', 'quillcrm');
			case CAMPAIGN_CHANNEL.SMS:
				return __('SMS Messages', 'quillcrm');
			case CAMPAIGN_CHANNEL.WHATSAPP:
				return __('WhatsApp Messages', 'quillcrm');
			default:
				return __('Messages', 'quillcrm');
		}
	};

	const getResendButtonText = () => {
		switch (campaign?.type) {
			case CAMPAIGN_CHANNEL.EMAIL:
				return __('Resend Failed Emails', 'quillcrm');
			case CAMPAIGN_CHANNEL.SMS:
				return __('Resend Failed SMS', 'quillcrm');
			case CAMPAIGN_CHANNEL.WHATSAPP:
				return __('Resend Failed WhatsApp', 'quillcrm');
			default:
				return __('Resend Failed Messages', 'quillcrm');
		}
	};

	const getCompletedMessage = () => {
		const messageType = getMessageTypeLabel().toLowerCase();
		return sprintf(
			__(
				'Campaign has been completed. %s %s failed to send.',
				'quillcrm'
			),
			campaign?.failed_count,
			messageType
		);
	};

	// Render analytics cards based on campaign type
	const renderAnalyticsCards = () => {
		if (!campaign) return null;

		const baseCards = [
			{
				icon: <UserOutlined />,
				title: __('Contacts', 'quillcrm'),
				value: campaign.contacts_count,
			},
			{
				icon: <SendOutlined />,
				title: __('Sent', 'quillcrm'),
				value: campaign.sent_count,
			},
			{
				icon: <WarningOutlined />,
				title: __('Failed', 'quillcrm'),
				value: campaign.failed_count,
			},
		];

		const typeSpecificCards: Array<{
			icon: JSX.Element;
			title: string;
			value: string | number;
		}> = [];

		// Email-specific metrics
		if (campaign.type === CAMPAIGN_CHANNEL.EMAIL) {
			typeSpecificCards.push(
				{
					icon: <EyeOutlined />,
					title: __('Open Rate', 'quillcrm'),
					value: `${calculatePercentage(totalMessages, campaign.opened_count || 0)}%`,
				},
				{
					icon: <LinkOutlined />,
					title: __('Click Rate', 'quillcrm'),
					value: `${calculatePercentage(totalMessages, campaign.clicked_count)}%`,
				}
			);
		}

		// SMS-specific metrics
		if (campaign.type === CAMPAIGN_CHANNEL.SMS) {
			typeSpecificCards.push(
				{
					icon: <CheckCircleOutlined />,
					title: __('Delivery Rate', 'quillcrm'),
					value: `${campaign.delivery_rate || 0}%`,
				},
				{
					icon: <LinkOutlined />,
					title: __('Click Rate', 'quillcrm'),
					value: `${campaign.click_rate || 0}%`,
				}
			);
		}

		// WhatsApp-specific metrics
		if (campaign.type === CAMPAIGN_CHANNEL.WHATSAPP) {
			typeSpecificCards.push(
				{
					icon: <CheckCircleOutlined />,
					title: __('Delivery Rate', 'quillcrm'),
					value: `${campaign.delivery_rate || 0}%`,
				},
				{
					icon: <ReadOutlined />,
					title: __('Read Rate', 'quillcrm'),
					value: `${campaign.read_rate || 0}%`,
				},
				{
					icon: <LinkOutlined />,
					title: __('Click Rate', 'quillcrm'),
					value: `${campaign.click_rate || 0}%`,
				}
			);
		}

		const allCards = [...baseCards, ...typeSpecificCards];

		return (
			<Flex gap={20} wrap="wrap">
				{allCards.map((card, index) => (
					<Card key={index} style={{ flex: 1, minWidth: 200 }}>
						<Flex vertical={true} gap={10}>
							<Flex gap={10}>
								{card.icon}
								<Typography.Text strong>
									{card.title}
								</Typography.Text>
							</Flex>
							<Typography.Text className="qcrm-analytics-count">
								{card.value}
							</Typography.Text>
						</Flex>
					</Card>
				))}
			</Flex>
		);
	};

	// Render chart data based on campaign type
	const renderChart = () => {
		if (!campaign) return null;

		let chartData: {
			labels: string[];
			data: number[];
			colors: string[];
		};

		if (campaign.type === CAMPAIGN_CHANNEL.EMAIL) {
			chartData = {
				labels: [
					__('Sent', 'quillcrm'),
					__('Failed', 'quillcrm'),
					__('Opened', 'quillcrm'),
					__('Clicked', 'quillcrm'),
				],
				data: [
					campaign.sent_count,
					campaign.failed_count,
					campaign.opened_count || 0,
					campaign.clicked_count,
				],
				colors: ['#1890ff', '#ff4d4f', '#52c41a', '#faad14'],
			};
		} else if (campaign.type === CAMPAIGN_CHANNEL.SMS) {
			chartData = {
				labels: [
					__('Sent', 'quillcrm'),
					__('Failed', 'quillcrm'),
					__('Delivered', 'quillcrm'),
					__('Clicked', 'quillcrm'),
				],
				data: [
					campaign.sent_count,
					campaign.failed_count,
					campaign.delivered_count || 0,
					campaign.clicked_count,
				],
				colors: ['#1890ff', '#ff4d4f', '#52c41a', '#faad14'],
			};
		} else {
			// WhatsApp
			chartData = {
				labels: [
					__('Sent', 'quillcrm'),
					__('Failed', 'quillcrm'),
					__('Delivered', 'quillcrm'),
					__('Read', 'quillcrm'),
					__('Clicked', 'quillcrm'),
				],
				data: [
					campaign.sent_count,
					campaign.failed_count,
					campaign.delivered_count || 0,
					campaign.read_count || 0,
					campaign.clicked_count,
				],
				colors: ['#1890ff', '#ff4d4f', '#52c41a', '#722ed1', '#faad14'],
			};
		}

		return (
			<Card>
				<Flex justify="center">
					<div style={{ maxWidth: 400 }}>
						<Chart
							type="doughnut"
							data={{
								labels: chartData.labels,
								datasets: [
									{
										data: chartData.data,
										backgroundColor: chartData.colors,
									},
								],
							}}
							options={{
								responsive: true,
								plugins: {
									legend: {
										display: true,
										position: 'bottom',
									},
								},
							}}
						/>
					</div>
				</Flex>
			</Card>
		);
	};

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
						{campaign &&
							(campaign.status === 'processing' ||
								campaign.status === 'resending') && <Spin />}
					</Flex>
				</Flex>
			}
		>
			{campaign && (
				<Flex gap={20} vertical>
					<Card title={__('Campaign Details')}>
						<Flex vertical gap={10}>
							<Flex gap={10}>
								<Typography.Text>
									{__('Campaign Name', 'quillcrm')} :
								</Typography.Text>
								<Typography.Text strong>
									{campaign.name}
								</Typography.Text>
							</Flex>
							<Flex gap={10}>
								<Typography.Text>
									{__('Campaign Type', 'quillcrm')} :
								</Typography.Text>
								<Typography.Text strong>
									{getCampaignChannelLabel(campaign.type).toUpperCase()}
								</Typography.Text>
							</Flex>
							<Flex vertical gap={10}>
								<Typography.Title level={5}>
									{__('Template', 'quillcrm')}
								</Typography.Title>
								<Table
									dataSource={campaign.settings.templates}
									columns={[
										{
											title: __('From Name', 'quillcrm'),
											dataIndex: 'from_name',
											key: 'from_name',
											render: (text) => text || '-',
										},
										...(campaign.type === CAMPAIGN_CHANNEL.EMAIL
											? [
													{
														title: __(
															'From Email',
															'quillcrm'
														),
														dataIndex: 'from_email',
														key: 'from_email',
														render: (text) =>
															text || '-',
													},
												]
											: []),
										{
											title:
												campaign.type === CAMPAIGN_CHANNEL.EMAIL
													? __('Subject', 'quillcrm')
													: __('Message', 'quillcrm'),
											dataIndex:
												campaign.type === CAMPAIGN_CHANNEL.EMAIL
													? 'subject'
													: 'message',
											key: 'content',
											render: (text) =>
												text && text.length > 50
													? text.substring(0, 50) +
														'...'
													: text || '-',
										},
										{
											title: __(
												'Total Recipients',
												'quillcrm'
											),
											key: 'total_recipients',
											render: (_, record: Template) =>
												campaign.templates_count[
													record['template_id']
												] || 0,
										},
										{
											title: __('View', 'quillcrm'),
											key: 'view',
											render: (_, record: Template) => (
												<Button
													onClick={() =>
														setTemplate(record)
													}
												>
													{__('View', 'quillcrm')}
												</Button>
											),
										},
									]}
									pagination={false}
								/>
							</Flex>
						</Flex>
					</Card>
					{renderAnalyticsCards()}
					{started && (
						<Flex>
							<Progress
								percent={
									totalMessages > 0
										? Math.round(
												(totalMessages /
													campaign.contacts_count) *
													100
											)
										: 0
								}
								format={(percent) => `${percent}%`}
							/>
						</Flex>
					)}
					{(campaign.status === 'processing' ||
						campaign.status === 'resending') &&
						!started && (
							<Flex gap={20}>
								<Typography.Text>
									{__('Campaign is being processed.')}
								</Typography.Text>
								<Spin />
							</Flex>
						)}
					{campaign.status === 'completed' &&
						!started &&
						campaign.failed_count > 0 && (
							<Card>
								<Flex vertical gap={20} align="center">
									<Typography.Title level={5}>
										{getCompletedMessage()}
									</Typography.Title>
									<Flex justify="center">
										<Button
											onClick={resendFailed}
											loading={resending}
											disabled={resending}
										>
											{getResendButtonText()}
										</Button>
									</Flex>
								</Flex>
							</Card>
						)}
					{renderChart()}
				</Flex>
			)}
			<Modal
				open={!!template}
				title={__('Template Details')}
				onCancel={() => setTemplate(null)}
				footer={null}
				style={{ minWidth: '800px' }}
			>
				{template && campaign && (
					<Flex vertical gap={20}>
						<Flex vertical gap={10}>
							<Flex gap={10}>
								<Typography.Text>
									{__('Total Recipients', 'quillcrm')}
									{': '}
								</Typography.Text>
								<Typography.Text strong>
									{
										campaign.templates_count[
											template['template_id']
										]
									}
								</Typography.Text>
							</Flex>
							{template.type === CAMPAIGN_CHANNEL.EMAIL &&
							template.settings?.from_name ? (
								<Flex gap={10}>
									<Typography.Text>
										{__('From Name', 'quillcrm')}
										{': '}
									</Typography.Text>
									<Typography.Text strong>
										{template.settings.from_name}
									</Typography.Text>
								</Flex>
							) : null}
							{template.type === CAMPAIGN_CHANNEL.EMAIL &&
							template.settings?.from_email ? (
								<Flex gap={10}>
									<Typography.Text>
										{__('From Email', 'quillcrm')}
										{': '}
									</Typography.Text>
									<Typography.Text strong>
										{template.settings.from_email}
									</Typography.Text>
								</Flex>
							) : null}
							{template.type === CAMPAIGN_CHANNEL.EMAIL && template.subject && (
								<Flex gap={10}>
									<Typography.Text>
										{__('Subject', 'quillcrm')}
										{': '}
									</Typography.Text>
									<Typography.Text strong>
										{template.subject}
									</Typography.Text>
								</Flex>
							)}
						</Flex>
						<Divider style={{ margin: 0 }} />
						<Card
							title={
								campaign.type === CAMPAIGN_CHANNEL.EMAIL
									? __('Body', 'quillcrm')
									: __('Message', 'quillcrm')
							}
						>
							<div
								dangerouslySetInnerHTML={{
									__html: template.body || '',
								}}
							/>
						</Card>
					</Flex>
				)}
			</Modal>
		</Card>
	);
};

export default Analytics;
