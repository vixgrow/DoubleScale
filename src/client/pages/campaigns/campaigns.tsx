/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import './style.scss';
import {
	AutomatedTriggerConfig,
	Campaign,
	CampaignModalStep,
	CampaignsResponse,
	CampaignType,
	NoticeMessage,
} from '@doublescale/client';
import { getToLink, useNavigate } from '@doublescale/navigation';
import { DataTable } from '@/components/ui/data-table';
import { emailCampaignColumns, smsCampaignColumns } from './columns';
import {
	PageHeader,
	PlusIcon,
	NoticeBanner,
	ContactTotalEmailsIcon,
	ContactSMSIcon,
} from '@/components';
import PageTabs from '@/components/page-tabs';
import DataTablePagination from '@/components/ui/data-table-pagination';
import EmptyCampaignList from './empty-campaign-list';
import AddCampaign from './add-campaign';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable'; // Import the hook
import { formatDateForAPI } from '@doublescale/utils';
import { ProviderNotConnectedWarning } from '@/client/pages/contact/components/provider-not-connected-warning';
import TwilioConfigModal from '@/client/pages/contact/components/twilio-config-modal';
import { useProviderStatus } from '@doublescale/hooks/use-provider-status';
import { moduleFetch } from '@doublescale/services/module-fetch';

export type CampaignChannel = 'email' | 'sms';

interface CampaignsProps {
	channel?: CampaignChannel;
}

const Campaigns: React.FC<CampaignsProps> = ({
	channel: channelProp,
}) => {
	const [activeTab, setActiveTab] = useState<CampaignChannel>('email');
	const channel = channelProp ?? activeTab;

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
	const [campaignFilters, setCampaignFilters] = useState({
		status: 'all',
		type: 'all',
		createDate: { from: null, to: null },
		updatedAt: { from: null, to: null },
	});
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [showTwilioConfig, setShowTwilioConfig] = useState(false);

	const navigate = useNavigate();

	// Check SMS provider status
	const {
		isConnected: isSmsProviderConnected,
		isLoading: isSmsProviderLoading,
		checkStatus: checkSmsProviderStatus,
	} = useProviderStatus('sms');

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
	}, [page, perPage, dateRange, keywords, channel, campaignFilters]);

	useEffect(() => {
		setPage(1);
		setSelectedRowKeys([]);
	}, [channel]);

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
				channel: channelMap[channel],
			};

			// Add campaign filter parameters
			if (campaignFilters.status && campaignFilters.status !== 'all') {
				queryParams.status = campaignFilters.status;
			}

			// Only apply type filter for email campaigns
			if (
				channel === 'email' &&
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

			const response = (await moduleFetch<CampaignsResponse>(
				'campaigns',
				{
					path: addQueryArgs('/doublescale/v1/campaigns', queryParams),
				}
			)) as CampaignsResponse | null;
			if (!response) {
				setCampaigns([]);
				setTotalRecords(0);
				setHasRecords(false);
				setNotice({
					type: 'error',
					message: __('The Campaigns module is disabled.', 'doublescale'),
				});
				return;
			}
			setCampaigns(response.data);
			setTotalRecords(response.total || 0);
			setHasRecords(response.total_count > 0);
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to fetch campaigns', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	};

	const addCampaign = async (
		name: string,
		selectedCampaignType: CampaignType,
		triggerConfig?: AutomatedTriggerConfig
	): Promise<{ success: boolean; error?: string }> => {
		if (!name) {
			return {
				success: false,
				error: __('Campaign name is required', 'doublescale'),
			};
		}

		try {
			let channelType = '';
			let isAbTest = false;
			const isAutomated = selectedCampaignType === 'automated';

			// Determine channel type based on active tab
			if (channel === 'email') {
				if (!selectedCampaignType) {
					return {
						success: false,
						error: __('Campaign type is required', 'doublescale'),
					};
				}
				channelType = 'email';
				isAbTest = selectedCampaignType === 'ab_test';
			} else if (channel === 'sms') {
				channelType = 'sms';
			}

			const settings: Record<string, any> = {
				ab_test: isAbTest,
			};

			if (isAutomated && triggerConfig) {
				settings.automated = true;
				settings.trigger = triggerConfig;
			}

			const response = (await moduleFetch<Campaign>('campaigns', {
				path: '/doublescale/v1/campaigns',
				method: 'POST',
				data: {
					name: name,
					type: channelType,
					settings,
					description: isAutomated
						? __('Automated campaign', 'doublescale')
						: __('New campaign', 'doublescale'),
					status: 'draft',
				},
			})) as Campaign | null;

			if (!response) {
				return {
					success: false,
					error: __('The Campaigns module is disabled.', 'doublescale'),
				};
			}

			setCampaigns([...campaigns, response]);
			setStep(null);
			const firstStep = isAutomated ? 'trigger' : 'template';
			navigate(getToLink(`campaigns/${response.id}/${firstStep}`), {
				state: { isNew: true },
			});
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
			const deleted = await moduleFetch('campaigns', {
				path: '/doublescale/v1/campaigns/bulk-delete',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
				},
			});
			if (!deleted) {
				setNotice({
					type: 'error',
					message: __('The Campaigns module is disabled.', 'doublescale'),
				});
				return;
			}

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
			const ok = await moduleFetch('campaigns', {
				path: `/doublescale/v1/campaigns/${id}`,
				method: 'DELETE',
			});
			if (!ok) {
				setNotice({
					type: 'error',
					message: __('The Campaigns module is disabled.', 'doublescale'),
				});
				return;
			}

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
			message: __('Duplicating campaign...', 'doublescale'),
		});

		try {
			// Use unified endpoint - type is auto-detected
			const response = (await moduleFetch<Campaign>('campaigns', {
				path: `/doublescale/v1/campaigns/${id}/duplicate`,
				method: 'POST',
			})) as Campaign | null;

			if (!response) {
				setNotice({
					type: 'error',
					message: __('The Campaigns module is disabled.', 'doublescale'),
				});
				return;
			}

			navigate(getToLink(`campaigns/${response.id}/template`));
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const changeCampaignStatus = async (id: number, status: 'active' | 'draft') => {
		try {
			const ok = await moduleFetch('campaigns', {
				path: `/doublescale/v1/campaigns/${id}`,
				method: 'PUT',
				data: { status },
			});

			if (!ok) {
				setNotice({
					type: 'error',
					message: __('The Campaigns module is disabled.', 'doublescale'),
				});
				return;
			}

			setNotice({
				type: 'success',
				message: status === 'active'
					? __('Campaign activated successfully.', 'doublescale')
					: __('Campaign deactivated successfully.', 'doublescale'),
			});

			fetchCampaigns();
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
			onStatusChange: changeCampaignStatus,
		};

		if (channel === 'email') {
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

	/**
	 * Handle successful Twilio configuration
	 * Refresh provider status
	 */
	const handleTwilioConfigSuccess = async () => {
		await checkSmsProviderStatus();
		setShowTwilioConfig(false);
	};

	/**
	 * Handle create campaign button click
	 * For SMS campaigns, check provider connection before opening modal
	 */
	const handleCreateCampaign = () => {
		if (channel === 'sms' && !isSmsProviderConnected) {
			// Show error notice if provider not configured
			setNotice({
				type: 'error',
				message: __(
					'Please configure Twilio before creating SMS campaigns',
					'doublescale'
				),
			});
			return;
		}
		setStep('campaign-types');
	};

	const columns = getColumns();

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
						activeTab={channel}
						config={{
							search: {
								placeholder: __('Search', 'doublescale'),
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
								activeTab: channel,
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
				<EmptyCampaignList
					setStep={setStep}
					campaignChannel={channel}
					onCreateClick={handleCreateCampaign}
				/>
			)}
		</>
	);

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

	// Determine if "Create Campaign" button should be shown
	// Hide for SMS campaigns when Twilio is not configured
	const showCreateButton =
		channel === 'email' ||
		(channel === 'sms' && isSmsProviderConnected);

	const listTitle =
		channel === 'sms'
			? __('SMS Campaigns', 'doublescale')
			: __('Email Campaigns', 'doublescale');

	const campaignBody = <CampaignContent />;

	if (channelProp === undefined) {
		return (
			<div className="doublescale-campaigns">
				<PageHeader
					title={__('Campaigns List', 'doublescale')}
					subtitle={__('Campaigns', 'doublescale')}
					actions={
						showCreateButton
							? [
									{
										label: __('Create Campaign', 'doublescale'),
										icon: <PlusIcon />,
										onClick: handleCreateCampaign,
									},
								]
							: []
					}
				/>

				{notice && (
					<NoticeBanner
						notice={notice}
						closeNotice={() => setNotice(null)}
					/>
				)}

				{channel === 'sms' &&
					!isSmsProviderConnected &&
					!isSmsProviderLoading && (
						<ProviderNotConnectedWarning
							channel="sms"
							onConfigureClick={() => setShowTwilioConfig(true)}
						/>
					)}

				<PageTabs
					defaultValue="email"
					tabsList={tabsList}
					tabsContent={tabsContent}
					onValueChange={(value) =>
						setActiveTab(value as CampaignChannel)
					}
					tabsListWrapperClassName="border px-5 py-3 rounded-lg mb-4"
					tabsListClassName="bg-transparent text-foreground gap-3"
				/>

				<AddCampaign
					setCampaignType={setCampaignType}
					campaignType={campaignType}
					setStep={setStep}
					step={step}
					addCampaign={addCampaign}
					activeTab={channel}
				/>

				<TwilioConfigModal
					open={showTwilioConfig}
					onClose={() => setShowTwilioConfig(false)}
					onSuccess={handleTwilioConfigSuccess}
				/>
			</div>
		);
	}

	return (
		<div className="doublescale-campaigns">
			<PageHeader
				title={listTitle}
				subtitle={__('Campaigns', 'doublescale')}
				actions={
					showCreateButton
						? [
								{
									label: __('Create Campaign', 'doublescale'),
									icon: <PlusIcon />,
									onClick: handleCreateCampaign,
								},
							]
						: []
				}
			/>

			{/* Notice Banner */}
			{notice && (
				<NoticeBanner
					notice={notice}
					closeNotice={() => setNotice(null)}
				/>
			)}

			{/* SMS: Show provider warning if not configured */}
			{channel === 'sms' &&
				!isSmsProviderConnected &&
				!isSmsProviderLoading && (
					<ProviderNotConnectedWarning
						channel="sms"
						onConfigureClick={() => setShowTwilioConfig(true)}
					/>
				)}

			{campaignBody}

			<AddCampaign
				setCampaignType={setCampaignType}
				campaignType={campaignType}
				setStep={setStep}
				step={step}
				addCampaign={addCampaign}
				activeTab={channel}
			/>

			{/* Twilio Configuration Modal */}
			<TwilioConfigModal
				open={showTwilioConfig}
				onClose={() => setShowTwilioConfig(false)}
				onSuccess={handleTwilioConfigSuccess}
			/>
		</div>
	);
};

export default Campaigns;
