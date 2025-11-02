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
	Spin,
	Progress,
	Button,
	Modal,
	Flex,
	Typography,
	Divider,
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

/**
 * Internal dependencies
 */
import './style.scss';
import { Campaign as CampaignType, Template } from '@quillcrm/client';
import { CAMPAIGN_CHANNEL, getCampaignChannelLabel } from '@/constants/campaign-channel';
import { useSelect, useDispatch } from '@wordpress/data';
import { getCampaignEndpoint } from '@quillcrm/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Analytics: React.FC = () => {
	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	) as CampaignType | null;

	const { updateCampaign: updateCampaignAction } =
		useDispatch('quillcrm/campaign');
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

			updateCampaignAction(response as any);

			if (response.status === 'completed') {
				setStarted(false);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsFetching(false);
		}
	}, [campaign, isFetching, started, updateCampaignAction]);

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
			const endpoint = getCampaignEndpoint(campaign.type);
			if (!endpoint) {
				throw new Error('Invalid campaign type');
			}

			const response = (await apiFetch({
				path: `${endpoint}/${campaign.id}`,
				method: 'PUT',
				data: {
					...campaign,
					status: 'resending',
				},
			})) as CampaignType;

			updateCampaignAction(response as any);
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

	// Get status colors
	const getStatusClasses = (status: string) => {
		switch (status?.toLowerCase()) {
			case 'completed':
				return 'border-[#16A34A] text-[#16A34A] bg-[#EFFFF5]';
			case 'processing':
			case 'resending':
				return 'border-[#5570F1] text-[#5570F1] bg-[#5570F129]';
			case 'draft':
				return 'border-[#1C1D22] text-[#1C1D22] bg-[#FFF2E2]';
			case 'scheduled':
				return 'border-[#faad14] text-[#faad14] bg-[#faad1429]';
			default:
				return 'border-gray-600 text-gray-600 bg-gray-100';
		}
	};

	// Render analytics metrics based on campaign type
	const renderMetrics = () => {
		if (!campaign) return null;

		const baseMetrics = [
			{
				icon: <UserOutlined className="text-[#458DC7]" />,
				label: __('Contacts', 'quillcrm'),
				value: campaign.contacts_count,
				bgColor: 'bg-[#E4EEFD]',
			},
			{
				icon: <SendOutlined className="text-[#16A34A]" />,
				label: __('Sent', 'quillcrm'),
				value: campaign.sent_count,
				bgColor: 'bg-[#D1F6DF]',
			},
			{
				icon: <WarningOutlined className="text-[#CC5F5F]" />,
				label: __('Failed', 'quillcrm'),
				value: campaign.failed_count,
				bgColor: 'bg-[#F57E7729]',
			},
		];

		const typeSpecificMetrics: Array<{
			icon: JSX.Element;
			label: string;
			value: string | number;
			bgColor: string;
		}> = [];

		// Email-specific metrics
		if (campaign.type === CAMPAIGN_CHANNEL.EMAIL) {
			typeSpecificMetrics.push(
				{
					icon: <EyeOutlined className="text-[#660FF1]" />,
					label: __('Open Rate', 'quillcrm'),
					value: `${calculatePercentage(totalMessages, campaign.opened_count || 0)}%`,
					bgColor: 'bg-[#EEE4FF]',
				},
				{
					icon: <LinkOutlined className="text-[#faad14]" />,
					label: __('Click Rate', 'quillcrm'),
					value: `${calculatePercentage(totalMessages, campaign.clicked_count)}%`,
					bgColor: 'bg-[#faad1429]',
				}
			);
		}

		// SMS-specific metrics
		if (campaign.type === CAMPAIGN_CHANNEL.SMS) {
			typeSpecificMetrics.push(
				{
					icon: <CheckCircleOutlined className="text-[#16A34A]" />,
					label: __('Delivery Rate', 'quillcrm'),
					value: `${campaign.delivery_rate || 0}%`,
					bgColor: 'bg-[#D1F6DF]',
				},
				{
					icon: <LinkOutlined className="text-[#faad14]" />,
					label: __('Click Rate', 'quillcrm'),
					value: `${campaign.click_rate || 0}%`,
					bgColor: 'bg-[#faad1429]',
				}
			);
		}

		// WhatsApp-specific metrics
		if (campaign.type === CAMPAIGN_CHANNEL.WHATSAPP) {
			typeSpecificMetrics.push(
				{
					icon: <CheckCircleOutlined className="text-[#16A34A]" />,
					label: __('Delivery Rate', 'quillcrm'),
					value: `${campaign.delivery_rate || 0}%`,
					bgColor: 'bg-[#D1F6DF]',
				},
				{
					icon: <ReadOutlined className="text-[#660FF1]" />,
					label: __('Read Rate', 'quillcrm'),
					value: `${campaign.read_rate || 0}%`,
					bgColor: 'bg-[#EEE4FF]',
				},
				{
					icon: <LinkOutlined className="text-[#faad14]" />,
					label: __('Click Rate', 'quillcrm'),
					value: `${campaign.click_rate || 0}%`,
					bgColor: 'bg-[#faad1429]',
				}
			);
		}

		const allMetrics = [...baseMetrics, ...typeSpecificMetrics];

		return (
			<div className="flex flex-col gap-3">
				{allMetrics.map((metric, index) => (
					<div key={index} className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className={`${metric.bgColor} p-1.5 rounded-full`}>
								{metric.icon}
							</div>
							<span className="text-sm text-gray-600">{metric.label}</span>
						</div>
						<span className="text-base font-semibold text-primary">
							{metric.value}
						</span>
					</div>
				))}
			</div>
		);
	};

	const getCompletedMessage = () => {
		return sprintf(
			__('Campaign completed. %s messages failed to send.', 'quillcrm'),
			campaign?.failed_count
		);
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

	if (!campaign) {
		return null;
	}

	return (
		<>
			<Card className="bg-[#F8F8F8] shadow-none w-1/3">
				<CardHeader className="border-b pb-4">
					<div className="flex flex-col gap-3">
						<CardTitle className="text-xl font-semibold truncate">
							{campaign.name}
						</CardTitle>
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-600">
								{__('Type:', 'quillcrm')} {getCampaignChannelLabel(campaign.type)}
							</span>
							<span
								className={`px-3 py-1 rounded text-xs font-medium border ${getStatusClasses(campaign.status)}`}
							>
								{campaign.status}
								{(campaign.status === 'processing' ||
									campaign.status === 'resending') && (
										<Spin size="small" className="ml-2" />
									)}
							</span>
						</div>
						{/* Subject Line - for email campaigns */}
						{campaign.type === CAMPAIGN_CHANNEL.EMAIL && campaign.settings?.templates?.[0]?.subject && (
							<div className="flex flex-col gap-1">
								<span className="text-xs text-gray-500">
									{__('Subject:', 'quillcrm')}
								</span>
								<span className="text-sm text-gray-700 font-medium">
									{campaign.settings.templates[0].subject}
								</span>
							</div>
						)}
						{/* Scheduled Date */}
						{campaign.execute_at && (
							<div className="flex flex-col gap-1">
								<span className="text-xs text-gray-500">
									{__('Scheduled On:', 'quillcrm')}
								</span>
								<span className="text-sm text-gray-700 font-medium">
									{new Date(campaign.execute_at).toLocaleString()}
								</span>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-5 pt-5">
					{/* Progress indicator */}
					{started && (
						<div className="flex flex-col gap-2">
							<span className="text-sm text-gray-600">
								{__('Progress', 'quillcrm')}
							</span>
							<Progress
								percent={
									totalMessages > 0
										? Math.round(
											(totalMessages / campaign.contacts_count) * 100
										)
										: 0
								}
								format={(percent) => `${percent}%`}
							/>
						</div>
					)}

					{/* Processing message */}
					{(campaign.status === 'processing' ||
						campaign.status === 'resending') &&
						!started && (
							<div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
								<Spin />
								<span className="text-sm">
									{__('Campaign is being processed...', 'quillcrm')}
								</span>
							</div>
						)}

					{/* Metrics */}
					<div className="flex flex-col gap-2">
						<h3 className="text-sm font-semibold text-gray-700">
							{__('Analytics', 'quillcrm')}
						</h3>
						{renderMetrics()}
					</div>

					{/* Resend failed messages button */}
					{campaign.status === 'completed' &&
						!started &&
						campaign.failed_count > 0 && (
							<div className="flex flex-col gap-3 p-3 bg-yellow-50 rounded">
								<span className="text-sm text-gray-700">
									{getCompletedMessage()}
								</span>
								<Button
									onClick={resendFailed}
									loading={resending}
									disabled={resending}
									size="small"
								>
									{getResendButtonText()}
								</Button>
							</div>
						)}

					{/* View templates button */}
					{campaign.settings?.templates &&
						campaign.settings.templates.length > 0 && (
							<div className="flex flex-col gap-2">
								<h3 className="text-sm font-semibold text-gray-700">
									{__('Templates', 'quillcrm')}
								</h3>
								<div className="flex flex-col gap-2">
									{campaign.settings.templates.map((tmpl, index) => (
										<Button
											key={index}
											onClick={() => setTemplate(tmpl)}
											size="small"
											block
										>
											{__('View Template', 'quillcrm')} #{index + 1}
										</Button>
									))}
								</div>
							</div>
						)}
				</CardContent>
			</Card>

			{/* Template Details Modal */}
			<Modal
				open={!!template}
				title={__('Template Details', 'quillcrm')}
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
						<div>
							<Typography.Title level={5}>
								{campaign.type === CAMPAIGN_CHANNEL.EMAIL
									? __('Body', 'quillcrm')
									: __('Message', 'quillcrm')}
							</Typography.Title>
							<div
								className="template-body-preview"
								dangerouslySetInnerHTML={{
									__html: template.body || '',
								}}
							/>
						</div>
					</Flex>
				)}
			</Modal>
		</>
	);
};

export default Analytics;
