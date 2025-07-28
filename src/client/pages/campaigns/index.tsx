/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	Campaign,
	CampaignModalStep,
	CampaignsResponse,
} from '@quillcrm/client';
import { getToLink, useNavigate } from '@quillcrm/navigation';
import { DataTable } from '@/components/ui/data-table';
import { campaignColumns } from './columns';
import { PageHeader, PlusIcon } from '@/components';
import DataTablePagination from '@/components/ui/data-table-pagination';
import EmptyCampaignList from './empty-campaign-list';
import AddCampaign from './add-campaign';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable'; // Import the hook
import { formatDateForAPI } from '@quillcrm/utils';

const Campaigns: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [campaignType, setCampaignType] = useState<string>('');
	const [keywords, setKeywords] = useState<string>('');
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [hasRecords, setHasRecords] = useState<boolean>(false);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [isAdding, setIsAdding] = useState<boolean>(false);
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState<boolean>(false);
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
	});
	const [step, setStep] = useState<CampaignModalStep>(null);

	const { createNotice } = useDispatch('quillcrm/core');
	const navigate = useNavigate();

	// Use the reusable hook
	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	useEffect(() => {
		fetchCampaigns();
	}, [page, perPage, dateRange, keywords]);

	const fetchCampaigns = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/campaigns', {
					page,
					per_page: perPage,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keywords,
				}),
			})) as CampaignsResponse;
			setCampaigns(response.data);
			setTotalRecords(response.total || 0);
			setHasRecords(response.total_count > 0);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch campaigns', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const addCampaign = async (name: string) => {
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
					settings: {
						ab_test: campaignType === 'ab_test',
					},
					description: __('New campaign', 'quillcrm'),
					status: 'draft',
				},
			})) as Campaign;

			setCampaigns([...campaigns, response]);
			setStep(null);
			navigate(getToLink(`campaigns/${response.id}`));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setStep(null);
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
						onClick: () => setStep('campaign-types'),
					},
				]}
			/>

			{hasRecords ? (
				<>
					<DataTable
						columns={columns}
						data={campaigns}
						showPagination={false}
						initialPageSize={perPage}
						setPage={setPage}
						config={{
							search: {
								placeholder: __('Search', 'quillcrm'),
								onChange: (value) => setKeywords(value),
								value: keywords,
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
					<DataTablePagination table={serverSideTable} />
				</>
			) : (
				<EmptyCampaignList setStep={setStep} />
			)}

			<AddCampaign
				setCampaignType={setCampaignType}
				campaignType={campaignType}
				setStep={setStep}
				step={step}
				addCampaign={addCampaign}
			/>
		</div>
	);
};

export default Campaigns;
