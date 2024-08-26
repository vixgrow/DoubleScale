/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Typography, Table, Input, Button, Modal } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { Campaign } from '../types';
import { NavLink } from '@quillcrm/navigation';

const { Column } = Table;

const Campaigns: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [visible, setVisible] = useState<boolean>(false);
	const [isAdding, setIsAdding] = useState<boolean>(false);
	const [name, setName] = useState<string>('');

	useEffect(() => {
		fetchCampaigns();
	}, [page, perPage]);

	const fetchCampaigns = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/campaigns', {
					page,
					per_page: perPage,
				}),
			})) as any;

			setCampaigns(response.data);
			setTotal(response.total);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const addCampaign = async () => {
		if (!name) {
			return;
		}
		setIsAdding(true);

		try {
			const response = (await apiFetch({
				path: '/qc/v1/campaigns',
				method: 'POST',
				data: {
					name: name,
					description: __('New campaign', 'quillcrm'),
					status: 'draft',
				},
			})) as any;

			setCampaigns([...campaigns, response]);
			setName('');
			setVisible(false);
		} catch (error) {
			console.error(error);
		} finally {
			setIsAdding(false);
		}
	};

	return (
		<div className="qcrm-campaigns">
			<div className="qcrm-campaigns-header">
				<Typography.Title level={4}>{__('Campaigns')}</Typography.Title>
				<Button onClick={() => setVisible(true)}>
					{__('Add Campaign')}
				</Button>
			</div>
			<Table
				dataSource={campaigns}
				rowKey="id"
				loading={loading}
				pagination={{
					total,
					current: page,
					pageSize: perPage,
					onChange: (page, pageSize) => {
						setPage(page);
						setPerPage(pageSize);
					},
				}}
				rowSelection={{
					selectedRowKeys,
					onChange: (selectedRowKeys) =>
						setSelectedRowKeys(selectedRowKeys),
				}}
			>
				<Column
					title={__('Name')}
					dataIndex="name"
					key="name"
					render={(_, record: Campaign) => (
						<NavLink
							to={
								record.status === 'completed'
									? `campaigns/${record.id}/overview`
									: `campaigns/${record.id}`
							}
						>
							{record.name}
						</NavLink>
					)}
				/>
				<Column title={__('Status')} dataIndex="status" key="status" />
				<Column
					title={__('Created At')}
					dataIndex="created_at"
					key="created_at"
				/>
				<Column
					title={__('Updated At')}
					dataIndex="updated_at"
					key="updated_at"
				/>
			</Table>
			<Modal
				title={__('Add Campaign')}
				open={visible}
				onOk={addCampaign}
				onCancel={() => setVisible(false)}
				footer={[
					<Button key="back" onClick={() => setVisible(false)}>
						{__('Cancel')}
					</Button>,
					<Button
						key="submit"
						type="primary"
						onClick={addCampaign}
						loading={isAdding}
					>
						{__('Add')}
					</Button>,
				]}
			>
				<Input
					placeholder={__('Campaign Name')}
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
			</Modal>
		</div>
	);
};

export default Campaigns;
