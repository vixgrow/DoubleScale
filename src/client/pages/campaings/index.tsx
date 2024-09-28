/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Flex, Table, Input, Button, Modal, Select } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { Campaign, CampaignsResponse } from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { getToLink, useNavigate } from '@quillcrm/navigation';
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
	const [keyword, setKeyword] = useState<string>('');
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState<boolean>(false);
	const { createNotice } = useDispatch('quillcrm/core');
	const navigate = useNavigate();

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
					keyword,
				}),
			})) as CampaignsResponse;

			setCampaigns(response.data);
			setTotal(response.total);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch campaigns', 'quillcrm'),
			});
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
			})) as Campaign;

			setCampaigns([...campaigns, response]);
			setName('');
			setVisible(false);
			navigate(getToLink(`campaigns/${response.id}`));
		} catch (error) {
			console.error(error);
		} finally {
			setIsAdding(false);
		}
	};

	const deleteSelected = async () => {
		setIsApplying(true);

		try {
			await apiFetch({
				path: '/qc/v1/campaigns',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			setSelectedRowKeys([]);
			fetchCampaigns();
		} catch (error) {
			console.error(error);
		} finally {
			setIsApplying(false);
		}
	};

	return (
		<div className="qcrm-campaigns">
			<Flex
				className="qcrm-contacts-list__actions"
				justify="space-between"
			>
				<Flex gap={10}>
					<Flex gap={10}>
						<Select
							options={[
								{
									label: __('Bulk Actions', 'quillcrm'),
									value: '',
								},
								{
									label: __('Delete', 'quillcrm'),
									value: 'delete',
								},
							]}
							value={bulkAction}
							onChange={(value) => setBulkAction(value)}
							disabled={selectedRowKeys.length === 0}
						/>
						<Button
							type="primary"
							onClick={() => {
								if (bulkAction === 'delete') {
									deleteSelected();
								}
							}}
							disabled={selectedRowKeys.length === 0}
							loading={isApplying}
						>
							{__('Apply', 'quillcrm')}
						</Button>
					</Flex>
					<Input.Search
						placeholder={__('Search', 'quillcrm')}
						allowClear
						onSearch={() => {
							fetchCampaigns();
						}}
						onChange={(e) => setKeyword(e.target.value)}
						styles={{
							affixWrapper: {
								padding: '4px 5px',
							},
							input: {
								minHeight: 'auto',
							},
						}}
					/>
				</Flex>
				<Button type="primary" onClick={() => setVisible(true)}>
					{__('Create Campaign', 'quillcrm')}
				</Button>
			</Flex>
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
