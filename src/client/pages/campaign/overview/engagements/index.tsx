/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import {
	Card,
	Flex,
	Typography,
	Table,
	Badge,
	Radio,
	Modal,
	Divider,
	Button,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CampaignEmail, CampaignEmailsResponse } from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { convertDate, getCampaignEndpoint } from '@quillcrm/utils';
import { useParams } from '@quillcrm/navigation';

const Engagements: React.FC = () => {
	const { id } = useParams<{ id: string; subtab: string }>();
	const [isLoading, setIsLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<CampaignEmail[]>([]);
	const { createNotice } = useDispatch('quillcrm/core');
	const [status, setStatus] = useState('all');
	const [campaignEmail, setCampaignEmail] = useState<CampaignEmail | null>(
		null
	);
	const [campaignType, setCampaignType] = useState<string | null>(null);

	// Helper function to get campaign type
	const fetchCampaignType = async () => {
		if (campaignType) return campaignType; // Already cached

		try {
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${id}`,
			})) as { type: string };
			setCampaignType(response.type);
			return response.type;
		} catch (error) {
			console.error('Failed to fetch campaign type:', error);
			return null;
		}
	};

	const fetchCampaignEmails = async () => {
		setIsLoading(true);

		try {
			// First, get the campaign type
			const type = await fetchCampaignType();
			if (!type) {
				throw new Error(
					__('Failed to determine campaign type', 'quillcrm')
				);
			}

			const endpoint = getCampaignEndpoint(type);
			if (!endpoint) {
				throw new Error(__('Invalid campaign type', 'quillcrm'));
			}

			const response = (await apiFetch({
				path: addQueryArgs(`${endpoint}/${id}/messages`, {
					per_page: perPage,
					page,
					status,
				}),
			})) as CampaignEmailsResponse;

			response.total && setTotal(response.total);
			response.data && setData(response.data);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message || __('Failed to fetch messages', 'quillcrm'),
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCampaignEmails();
	}, [page, perPage, status]);

	// Get type-aware status options
	const getStatusOptions = () => {
		const baseOptions = [
			{ value: 'all', label: __('All', 'quillcrm') },
			{ value: 'sent', label: __('Sent', 'quillcrm') },
			{ value: 'failed', label: __('Failed', 'quillcrm') },
		];

		if (campaignType === 'email') {
			return [
				...baseOptions,
				{ value: 'opened', label: __('Opened', 'quillcrm') },
				{ value: 'clicked', label: __('Clicked', 'quillcrm') },
			];
		} else if (campaignType === 'sms') {
			return [
				...baseOptions,
				{ value: 'pending', label: __('Pending', 'quillcrm') },
				{ value: 'delivered', label: __('Delivered', 'quillcrm') },
				{ value: 'clicked', label: __('Clicked', 'quillcrm') },
			];
		} else if (campaignType === 'whatsapp') {
			return [
				...baseOptions,
				{ value: 'pending', label: __('Pending', 'quillcrm') },
				{ value: 'delivered', label: __('Delivered', 'quillcrm') },
				{ value: 'read', label: __('Read', 'quillcrm') },
				{ value: 'clicked', label: __('Clicked', 'quillcrm') },
			];
		}

		return baseOptions;
	};

	// Get type-aware columns
	const getColumns = () => {
		const baseColumns = [
			{
				title: __('Contact', 'quillcrm'),
				dataIndex: 'contact',
				key: 'contact',
				render: (_, record: CampaignEmail) => (
					<NavLink to={`contacts/${record.contact.id}`}>
						<Flex vertical gap={5}>
							<Flex gap={10} align="center">
								<div className="qcrm-contacts-list__avatar">
									<UserOutlined />
								</div>
								{record.contact.first_name || '-'}{' '}
								{record.contact.last_name || '-'}
							</Flex>
							<Typography.Text type="secondary">
								{__('Sent on', 'quillcrm')}{' '}
								{convertDate(record.sent_at)}
							</Typography.Text>
						</Flex>
					</NavLink>
				),
			},
			{
				title:
					campaignType === 'email'
						? __('Email', 'quillcrm')
						: __('Phone', 'quillcrm'),
				dataIndex: 'recipient',
				key: 'recipient',
				render: (_, record: CampaignEmail) =>
					campaignType === 'email'
						? record.contact.email
						: record.contact.phone || '-',
			},
			{
				title: __('Status', 'quillcrm'),
				dataIndex: 'status',
				key: 'status',
				render: (_, record: CampaignEmail) => {
					let badgeStatus:
						| 'success'
						| 'error'
						| 'warning'
						| 'processing'
						| 'default' = 'default';

					if (
						record.status === 'sent' ||
						record.status === 'delivered'
					) {
						badgeStatus = 'success';
					} else if (record.status === 'failed') {
						badgeStatus = 'error';
					} else if (record.status === 'pending') {
						badgeStatus = 'processing';
					} else if (record.status === 'read') {
						badgeStatus = 'success';
					}

					return <Badge status={badgeStatus} text={record.status} />;
				},
			},
		];

		// Add type-specific columns
		const typeSpecificColumns = [];

		if (campaignType === 'email') {
			typeSpecificColumns.push(
				{
					title: __('Opened', 'quillcrm'),
					dataIndex: 'opened',
					key: 'opened',
					render: (_, record: CampaignEmail) => (
						<Badge
							status={
								record.opened != '0' ? 'success' : 'default'
							}
							text={
								record.opened != '0'
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')
							}
						/>
					),
				},
				{
					title: __('Clicked', 'quillcrm'),
					dataIndex: 'clicked',
					key: 'clicked',
					render: (_, record: CampaignEmail) => (
						<Badge
							status={
								record.clicked != '0' ? 'success' : 'default'
							}
							text={
								record.clicked != '0'
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')
							}
						/>
					),
				}
			);
		} else if (campaignType === 'sms') {
			typeSpecificColumns.push(
				{
					title: __('Delivered', 'quillcrm'),
					dataIndex: 'status',
					key: 'delivered',
					render: (_, record: CampaignEmail) => (
						<Badge
							status={
								record.status === 'delivered'
									? 'success'
									: 'default'
							}
							text={
								record.status === 'delivered'
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')
							}
						/>
					),
				},
				{
					title: __('Clicked', 'quillcrm'),
					dataIndex: 'clicked',
					key: 'clicked',
					render: (_, record: CampaignEmail) => (
						<Badge
							status={
								record.clicked != '0' ? 'success' : 'default'
							}
							text={
								record.clicked != '0'
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')
							}
						/>
					),
				}
			);
		} else if (campaignType === 'whatsapp') {
			typeSpecificColumns.push(
				{
					title: __('Delivered', 'quillcrm'),
					dataIndex: 'status',
					key: 'delivered',
					render: (_, record: CampaignEmail) => (
						<Badge
							status={
								record.status === 'delivered' ||
								record.status === 'read'
									? 'success'
									: 'default'
							}
							text={
								record.status === 'delivered' ||
								record.status === 'read'
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')
							}
						/>
					),
				},
				{
					title: __('Read', 'quillcrm'),
					dataIndex: 'status',
					key: 'read',
					render: (_, record: CampaignEmail) => (
						<Badge
							status={
								record.status === 'read' ? 'success' : 'default'
							}
							text={
								record.status === 'read'
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')
							}
						/>
					),
				},
				{
					title: __('Clicked', 'quillcrm'),
					dataIndex: 'clicked',
					key: 'clicked',
					render: (_, record: CampaignEmail) => (
						<Badge
							status={
								record.clicked != '0' ? 'success' : 'default'
							}
							text={
								record.clicked != '0'
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')
							}
						/>
					),
				}
			);
		}

		return [
			...baseColumns,
			...typeSpecificColumns,
			{
				title: __('Template', 'quillcrm'),
				key: 'template',
				render: (_, record: CampaignEmail) => (
					<Button onClick={() => setCampaignEmail(record)}>
						{__('View', 'quillcrm')}
					</Button>
				),
			},
		];
	};

	return (
		<Card
			title={
				<Flex justify="space-between">
					<Typography.Title level={4} style={{ margin: 0 }}>
						{__('Engagements')}
					</Typography.Title>
				</Flex>
			}
		>
			<Flex vertical gap={20}>
				<Flex gap={20} align="center">
					<Typography.Text>{__('Filter by status')}</Typography.Text>
					<Radio.Group
						options={getStatusOptions()}
						onChange={(e) => setStatus(e.target.value)}
						value={status}
						optionType="button"
						buttonStyle="solid"
					/>
				</Flex>
				<Table
					dataSource={data}
					columns={getColumns()}
					loading={isLoading}
					pagination={{
						current: page,
						pageSize: perPage,
						total: total,
						onChange: (page, pageSize) => {
							setPage(page);
							setPerPage(pageSize);
						},
					}}
				/>
			</Flex>
			<Modal
				open={!!campaignEmail}
				title={__('Details')}
				onCancel={() => setCampaignEmail(null)}
				footer={null}
				style={{ minWidth: '800px' }}
			>
				{campaignEmail && (
					<Flex vertical gap={20}>
						<Flex vertical gap={10}>
							<Flex gap={10}>
								<Typography.Text>
									{__('Status', 'quillcrm')}
									{': '}
								</Typography.Text>
								<Badge
									status={
										campaignEmail.status === 'sent' ||
										campaignEmail.status === 'delivered' ||
										campaignEmail.status === 'read'
											? 'success'
											: campaignEmail.status === 'failed'
												? 'error'
												: 'default'
									}
									text={campaignEmail.status}
								/>
							</Flex>
							{campaignEmail.template.settings.from_name && (
								<Flex gap={10}>
									<Typography.Text>
										{__('From Name', 'quillcrm')}
										{': '}
									</Typography.Text>
									<Typography.Text strong>
										{
											campaignEmail.template.settings
												.from_name
										}
									</Typography.Text>
								</Flex>
							)}
							{campaignType === 'email' &&
								campaignEmail.template.settings.from_email && (
									<Flex gap={10}>
										<Typography.Text>
											{__('From Email', 'quillcrm')}
											{': '}
										</Typography.Text>
										<Typography.Text strong>
											{
												campaignEmail.template.settings
													.from_email
											}
										</Typography.Text>
									</Flex>
								)}
							{campaignType === 'email' &&
								campaignEmail.template.subject && (
									<Flex gap={10}>
										<Typography.Text>
											{__('Subject', 'quillcrm')}
											{': '}
										</Typography.Text>
										<Typography.Text strong>
											{campaignEmail.template.subject}
										</Typography.Text>
									</Flex>
								)}
						</Flex>
						<Divider style={{ margin: 0 }} />
						<Card
							title={
								campaignType === 'email'
									? __('Body', 'quillcrm')
									: __('Message', 'quillcrm')
							}
						>
							<div
								dangerouslySetInnerHTML={{
									__html: campaignEmail.template.body || '',
								}}
							/>
						</Card>
					</Flex>
				)}
			</Modal>
		</Card>
	);
};

export default Engagements;
