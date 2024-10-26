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
import { Card, Flex, Typography, Table, Badge, Radio, Modal, Divider, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CampaignEmail, CampaignEmailsResponse } from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { convertDate } from '@quillcrm/utils';
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
	const [campaignEmail, setCampaignEmail] = useState<CampaignEmail | null>(null);

	const fetchCampaignEmails = async () => {
		setIsLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/campaigns/${id}/emails`, {
					per_page: perPage,
					page,
					status,
				}),
			})) as CampaignEmailsResponse;

			response.total && setTotal(response.total);
			response.data && setData(response.data);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch contacts', 'quillcrm'),
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCampaignEmails();
	}, [page, perPage, status]);

	const columns = [
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
			title: __('Email', 'quillcrm'),
			dataIndex: 'email',
			key: 'email',
			render: (_, record: CampaignEmail) => record.contact.email,
		},
		{
			title: __('Status', 'quillcrm'),
			dataIndex: 'status',
			key: 'status',
			render: (_, record: CampaignEmail) => (
				<Badge
					status={record.status === 'sent' ? 'success' : 'error'}
					text={record.status}
				/>
			),
		},
		{
			title: __('Opened', 'quillcrm'),
			dataIndex: 'opened',
			key: 'opened',
			render: (_, record: CampaignEmail) => (
				<Badge
					status={record.opened != '0' ? 'success' : 'default'}
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
					status={record.clicked != '0' ? 'success' : 'default'}
					text={
						record.clicked != '0'
							? __('Yes', 'quillcrm')
							: __('No', 'quillcrm')
					}
				/>
			),
		},
		{
			title: __('Template', 'quillcrm'),
			key: 'template',
			render: (_, record: CampaignEmail) => (
				<Button onClick={() => setCampaignEmail(record)}>
					{__('View', 'quillcrm')}
				</Button>
			),
		}
	];

	const statusOptions = [
		{ value: 'all', label: __('All', 'quillcrm') },
		{ value: 'sent', label: __('Sent', 'quillcrm') },
		{ value: 'failed', label: __('Failed', 'quillcrm') },
		{ value: 'opened', label: __('Opened', 'quillcrm') },
		{ value: 'clicked', label: __('Clicked', 'quillcrm') },
	];

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
				<Flex gap={20} align='center'>
					<Typography.Text>{__('Filter by status')}</Typography.Text>
					<Radio.Group
						options={statusOptions}
						onChange={(e) => setStatus(e.target.value)}
						value={status}
						optionType="button"
						buttonStyle="solid"
					/>
				</Flex>
				<Table
					dataSource={data}
					columns={columns}
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
								<Typography.Text>{__('Status', 'quillcrm')}{': '}</Typography.Text>
								<Badge
									status={campaignEmail.status === 'sent' ? 'success' : 'error'}
									text={campaignEmail.status}
								/>
							</Flex>
							<Flex gap={10}>
								<Typography.Text>{__('From Name', 'quillcrm')}{': '}</Typography.Text>
								<Typography.Text strong>{campaignEmail.template.settings.from_name}</Typography.Text>
							</Flex>
							<Flex gap={10}>
								<Typography.Text>{__('From Email', 'quillcrm')}{': '}</Typography.Text>
								<Typography.Text strong>{campaignEmail.template.settings.from_email}</Typography.Text>
							</Flex>
							<Flex gap={10}>
								<Typography.Text>{__('Subject', 'quillcrm')}{': '}</Typography.Text>
								<Typography.Text strong>{campaignEmail.template.subject}</Typography.Text>
							</Flex>
						</Flex>
						<Divider style={{ margin: 0 }} />
						<Card title={__('Body', 'quillcrm')}>
							<div dangerouslySetInnerHTML={{ __html: campaignEmail.template.body }} />
						</Card>
					</Flex>
				)}
			</Modal>
		</Card>
	);
};

export default Engagements;
