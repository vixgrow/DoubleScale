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

const Analytics: React.FC = () => {
	const { campaign, isLoading, updateCampaign, saveCampaign } =
		useCampaignContext();
	const totalEmails = campaign
		? campaign.sent_count + campaign.failed_count
		: 0;
	const [isFetching, setIsFetching] = useState(false);
	const [started, setStarted] = useState(
		campaign?.status === 'processing' && totalEmails > 0
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

			const totalEmails = response.sent_count + response.failed_count;
			if (
				totalEmails > 0 &&
				!started &&
				totalEmails !== campaign.sent_count + campaign.failed_count
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
										},
										{
											title: __('From Email', 'quillcrm'),
											dataIndex: 'from_email',
											key: 'from_email',
										},
										{
											title: __('Subject', 'quillcrm'),
											dataIndex: 'subject',
											key: 'subject',
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
												],
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
					<Flex gap={20}>
						<Card style={{ flex: 1 }}>
							<Flex vertical={true} gap={10}>
								<Flex gap={10}>
									<UserOutlined />
									<Typography.Text strong>
										{__('Contacts', 'quillcrm')}
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
										{__('Sent', 'quillcrm')}
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
									<WarningOutlined />
									<Typography.Text strong>
										{__('Failed', 'quillcrm')}
									</Typography.Text>
								</Flex>
								<Typography.Text className="qcrm-analytics-count">
									{campaign.failed_count}
								</Typography.Text>
							</Flex>
						</Card>
						<Card style={{ flex: 1 }}>
							<Flex vertical={true} gap={10}>
								<Flex gap={10}>
									<EyeOutlined />
									<Typography.Text strong>
										{__('Open Rate', 'quillcrm')}
									</Typography.Text>
								</Flex>
								<Typography.Text className="qcrm-analytics-count">
									{calculatePercentage(
										totalEmails,
										campaign.opened_count
									)}
									%
								</Typography.Text>
							</Flex>
						</Card>
						<Card style={{ flex: 1 }}>
							<Flex vertical={true} gap={10}>
								<Flex gap={10}>
									<LinkOutlined />
									<Typography.Text strong>
										{__('Click Rate', 'quillcrm')}
									</Typography.Text>
								</Flex>
								<Typography.Text className="qcrm-analytics-count">
									{calculatePercentage(
										totalEmails,
										campaign.clicked_count
									)}
									%
								</Typography.Text>
							</Flex>
						</Card>
					</Flex>
					{started && (
						<Flex>
							<Progress
								percent={
									totalEmails > 0
										? Math.round(
												(totalEmails /
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
										{sprintf(
											__(
												'Campaign has been completed. %s emails failed to send.',
												'quillcrm'
											),
											campaign.failed_count
										)}
									</Typography.Title>
									<Flex justify="center">
										<Button
											onClick={resendFailed}
											loading={resending}
											disabled={resending}
										>
											{__(
												'Resend Failed Emails',
												'quillcrm'
											)}
										</Button>
									</Flex>
								</Flex>
							</Card>
						)}
					<Card>
						<Flex justify="center">
							<div style={{ maxWidth: 400 }}>
								<Chart
									type="doughnut"
									data={{
										labels: [
											__('Sent', 'quillcrm'),
											__('Failed', 'quillcrm'),
											__('Opened', 'quillcrm'),
											__('Clicked', 'quillcrm'),
										],
										datasets: [
											{
												data: [
													campaign.sent_count,
													campaign.failed_count,
													campaign.opened_count,
													campaign.clicked_count,
												],
												backgroundColor: [
													'#1890ff',
													'#ff4d4f',
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
							<Flex gap={10}>
								<Typography.Text>
									{__('From Name', 'quillcrm')}
									{': '}
								</Typography.Text>
								<Typography.Text strong>
									{template.from_name}
								</Typography.Text>
							</Flex>
							<Flex gap={10}>
								<Typography.Text>
									{__('From Email', 'quillcrm')}
									{': '}
								</Typography.Text>
								<Typography.Text strong>
									{template.from_email}
								</Typography.Text>
							</Flex>
							<Flex gap={10}>
								<Typography.Text>
									{__('Subject', 'quillcrm')}
									{': '}
								</Typography.Text>
								<Typography.Text strong>
									{template.subject}
								</Typography.Text>
							</Flex>
						</Flex>
						<Divider style={{ margin: 0 }} />
						<Card title={__('Body', 'quillcrm')}>
							<div
								dangerouslySetInnerHTML={{
									__html: template.body,
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
