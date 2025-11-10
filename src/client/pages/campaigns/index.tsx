/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	Campaign,
	CampaignModalStep,
	CampaignsResponse,
	CampaignType,
	NoticeMessage,
} from '@quillcrm/client';
import { getToLink, useNavigate } from '@quillcrm/navigation';
import { DataTable } from '@/components/ui/data-table';
import { emailCampaignColumns, smsCampaignColumns } from './columns';
import {
	PageHeader,
	PlusIcon,
	ContactTotalEmailsIcon,
	ContactSMSIcon,
	NoticeBanner,
} from '@/components';
import DataTablePagination from '@/components/ui/data-table-pagination';
import EmptyCampaignList from './empty-campaign-list';
import AddCampaign from './add-campaign';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable'; // Import the hook
import { formatDateForAPI } from '@quillcrm/utils';
import PageTabs from '@/components/page-tabs';

const Campaigns: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [campaignType, setCampaignType] = useState<CampaignType>('standard');
	const [keywords, setKeywords] = useState<string>('');
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [hasRecords, setHasRecords] = useState<boolean>(false);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	// const [bulkAction, setBulkAction] = useState<string>('');
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
	});
	const [step, setStep] = useState<CampaignModalStep>(null);
	const [activeTab, setActiveTab] = useState<string>('email');
	const [campaignFilters, setCampaignFilters] = useState({
		status: 'all',
		type: 'all',
		createDate: { from: null, to: null },
		updatedAt: { from: null, to: null },
	});
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

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
	}, [page, perPage, dateRange, keywords, activeTab, campaignFilters]);

	// Reset page when changing tabs
	useEffect(() => {
		setPage(1);
		setSelectedRowKeys([]);
	}, [activeTab]);

	const fetchCampaigns = async () => {
		setLoading(true);

		try {
			// Map active tab to campaign channel - using actual database values
			const channelMap: Record<string, string> = {
				email: 'email',
				sms: 'sms',
			};

			// Build query parameters
			const queryParams: Record<string, any> = {
				page,
				per_page: perPage,
				from: formatDateForAPI(dateRange.from),
				to: formatDateForAPI(dateRange.to),
				keywords,
				channel: channelMap[activeTab],
			};

			// Add campaign filter parameters
			if (campaignFilters.status && campaignFilters.status !== 'all') {
				queryParams.status = campaignFilters.status;
			}

			// Only apply type filter for email campaigns
			if (
				activeTab === 'email' &&
				campaignFilters.type &&
				campaignFilters.type !== 'all'
			) {
				// Map type to ab_test setting
				queryParams.campaign_type = campaignFilters.type;
			}

			if (campaignFilters.createDate.from) {
				queryParams.created_from = formatDateForAPI(
					campaignFilters.createDate.from
				);
			}

			if (campaignFilters.createDate.to) {
				queryParams.created_to = formatDateForAPI(
					campaignFilters.createDate.to
				);
			}

			if (campaignFilters.updatedAt.from) {
				queryParams.updated_from = formatDateForAPI(
					campaignFilters.updatedAt.from
				);
			}

			if (campaignFilters.updatedAt.to) {
				queryParams.updated_to = formatDateForAPI(
					campaignFilters.updatedAt.to
				);
			}

			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/campaigns', queryParams),
			})) as CampaignsResponse;
			setCampaigns(response.data);
			setTotalRecords(response.total || 0);
			setHasRecords(response.total_count > 0);
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to fetch campaigns', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const addCampaign = async (
		name: string
	): Promise<{ success: boolean; error?: string }> => {
		if (!name) {
			return {
				success: false,
				error: __('Campaign name is required', 'quillcrm'),
			};
		}

		try {
			let channelType = '';
			let isAbTest = false;

			// Determine channel type based on active tab
			if (activeTab === 'email') {
				// For email, campaignType determines if it's standard or ab_test
				if (!campaignType) {
					return {
						success: false,
						error: __('Campaign type is required', 'quillcrm'),
					};
				}
				channelType = 'email';
				isAbTest = campaignType === 'ab_test';
			} else if (activeTab === 'sms') {
				channelType = 'sms';
			}

			// Use unified endpoint with type parameter (as string)
			const response = (await apiFetch({
				path: '/qc/v1/campaigns',
				method: 'POST',
				data: {
					name: name,
					type: channelType,
					settings: {
						ab_test: isAbTest,
					},
					description: __('New campaign', 'quillcrm'),
					status: 'draft',
				},
			})) as Campaign;

			setCampaigns([...campaigns, response]);
			setStep(null);
			navigate(getToLink(`campaigns/${response.id}/template`));
			return { success: true };
		} catch (error: any) {
			return {
				success: false,
				error: error.message,
			};
		}
	};

	const deleteSelected = async () => {
		try {
			// Use unified bulk-delete endpoint (works across all campaign types)
			await apiFetch({
				path: '/qc/v1/campaigns/bulk-delete',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
				},
			});

			setSelectedRowKeys([]);
			fetchCampaigns();
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const deleteCampaign = async (id: number) => {
		try {
			// Use unified endpoint - type is auto-detected
			await apiFetch({
				path: `/qc/v1/campaigns/${id}`,
				method: 'DELETE',
			});

			fetchCampaigns();
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const duplicateCampaign = async (id: number) => {
		setNotice({
			type: 'success',
			message: __('Duplicating campaign...', 'quillcrm'),
		});

		try {
			// Use unified endpoint - type is auto-detected
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${id}/duplicate`,
				method: 'POST',
			})) as Campaign;

			navigate(getToLink(`campaigns/${response.id}`));
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	// Get columns based on active tab
	const getColumns = () => {
		const columnProps = {
			onDelete: deleteCampaign,
			duplicate: duplicateCampaign,
			navigate: navigate,
		};

		if (activeTab === 'email') {
			return emailCampaignColumns(columnProps);
		} else {
			// Both SMS and WhatsApp use the same columns
			return smsCampaignColumns(columnProps);
		}
	};

	const handleBulkAction = async (action: string) => {
		switch (action) {
			case 'delete':
				deleteSelected();
				break;
			default:
				break;
		}
	};

	const columns = getColumns();

	// Define tabs list with icons
	const tabsList = [
		{
			value: 'email',
			label: 'Email Campaigns',
			icon: <ContactTotalEmailsIcon width={24} height={24} />,
		},
		{
			value: 'sms',
			label: 'SMS Campaigns',
			icon: <ContactSMSIcon width={24} height={24} />,
		},
	];

	// Campaign content component
	const CampaignContent = () => (
		<>
			{loading || hasRecords ? (
				<>
					<DataTable
						columns={columns}
						data={campaigns}
						showPagination={false}
						initialPageSize={perPage}
						setPage={setPage}
						loading={loading}
						activeTab={activeTab}
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
							// TODO: investigate why setBulkAction is not working
							bulkActions: {
								enabled: true,
								currentAction: '',
								onActionChange: () => {},
								onExecuteAction: handleBulkAction,
								activeTab: activeTab,
							},
							dateRange: {
								enabled: true,
								value: dateRange,
								onDateChange: setDateRange,
							},
							campaignFilters: {
								filters: campaignFilters,
								onFiltersChange: setCampaignFilters,
								onClear: () => {
									setCampaignFilters({
										status: 'all',
										type: 'all',
										createDate: { from: null, to: null },
										updatedAt: { from: null, to: null },
									});
									setPage(1);
								},
							},
						}}
					/>
					<DataTablePagination table={serverSideTable} />
				</>
			) : (
				<EmptyCampaignList setStep={setStep} />
			)}
		</>
	);

	// Define tabs content
	const tabsContent = [
		{
			value: 'email',
			children: <CampaignContent />,
		},
		{
			value: 'sms',
			children: <CampaignContent />,
		},
	];

	return (
		<div className="qcrm-campaigns h-screen">
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

			{/* Notice Banner */}
			{notice && (
				<NoticeBanner
					notice={notice}
					closeNotice={() => setNotice(null)}
				/>
			)}

			<PageTabs
				defaultValue="email"
				tabsList={tabsList}
				tabsContent={tabsContent}
				onValueChange={(value) => setActiveTab(value)}
				tabsListWrapperClassName="border px-5 py-3 rounded-lg mb-4"
				tabsListClassName="bg-transparent text-foreground gap-3"
			/>

			<AddCampaign
				setCampaignType={setCampaignType}
				campaignType={campaignType}
				setStep={setStep}
				step={step}
				addCampaign={addCampaign}
				activeTab={activeTab}
			/>
		</div>
	);
};

export default Campaigns;
