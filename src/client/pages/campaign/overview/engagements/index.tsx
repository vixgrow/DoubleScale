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
import { Card, Flex, Typography, Table, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import { CampaignEmail, CampaignEmailsResponse } from '@quillcrm/client';
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

	const fetchCampaignEmails = async () => {
		setIsLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/campaigns/${id}/emails`, {
					per_page: perPage,
					page,
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
	}, [page, perPage]);

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
					status={record.status === 'sent' ? 'success' : 'default'}
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
		</Card>
	);
};

export default Engagements;
