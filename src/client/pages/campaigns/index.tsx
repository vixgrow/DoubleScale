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

import {
	EditOutlined,
	DeleteOutlined,
	CopyOutlined,
	MoreOutlined,
} from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import { Campaign, CampaignsResponse } from '@quillcrm/client';
import { getToLink, useNavigate } from '@quillcrm/navigation';
import { convertDate } from '@quillcrm/utils';
import { DataTable } from '../../../components/ui/data-table';
import { campaignColumns } from './columns';
import { PageHeader, PlusIcon } from '../../../components';

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
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
	});

	const { createNotice } = useDispatch('quillcrm/core');
	const navigate = useNavigate();

	useEffect(() => {
		fetchCampaigns();
	}, [page, perPage, dateRange]);

	const fetchCampaigns = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/campaigns', {
					page,
					per_page: perPage,
					keyword,
					from: dateRange.from?.toISOString(),
					to: dateRange.to?.toISOString(),
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
			createNotice({
				type: 'error',
				message: __('Campaign name is required', 'quillcrm'),
			});
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
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
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
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const deleteCampaign = async (id: number) => {
		try {
			await apiFetch({
				path: `/qc/v1/campaigns/${id}`,
				method: 'DELETE',
			});

			fetchCampaigns();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const duplicateCampaign = async (id: number) => {
		createNotice({
			type: 'info',
			message: __('Duplicating campaign...', 'quillcrm'),
		});

		try {
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${id}/duplicate`,
				method: 'POST',
			})) as Campaign;

			navigate(getToLink(`campaigns/${response.id}`));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const columns = campaignColumns({
		onDelete: deleteCampaign,
		duplicate: duplicateCampaign,
		navigate: navigate,
	});

	return (
		<div className="qcrm-campaigns">
			<PageHeader
				title={__('Campaigns List', 'quillcrm')}
				subtitle={__('Campaigns', 'quillcrm')}
				actions={[
					{
						label: __('Create Campaign', 'quillcrm'),
						icon: <PlusIcon />,
						onClick: () => setVisible(true),
					},
				]}
			/>
			<DataTable
				columns={columns}
				data={campaigns}
				config={{
					search: {
						placeholder: __('Search', 'quillcrm'),
					},
					selection: {
						enabled: true,
						selectedKeys: selectedRowKeys,
						onSelectionChange: setSelectedRowKeys,
					},
					bulkActions: {
						enabled: true,
						currentAction: bulkAction,
						onActionChange: (value) => setBulkAction(value),
						onExecuteAction: () => deleteSelected(),
						activeTab: 'all',
					},
					dateRange: {
						enabled: true,
						value: dateRange,
						onDateChange: setDateRange,
					},
				}}
			/>
		</div>
	);
};

export default Campaigns;
