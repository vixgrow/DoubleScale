/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	CampaignEmail,
	CampaignEmailsResponse,
	NoticeMessage,
} from '@doublescale/client';
import { useParams } from '@doublescale/navigation';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { getColumns } from './columns';
import MessageDetails from './message-details-dialog';
import {
	ContactTotalEmailsIcon,
	NoData,
	NoticeBanner,
	BadConnectionIcon,
	SendEmailsIcon,
	AlertIcon,
} from '@doublescale/components';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const EmailsTab: React.FC = () => {
	const { id } = useParams<{ id: string; subtab: string }>();
	const [isLoading, setIsLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [totalRecords, setTotalRecords] = useState(0);
	const [data, setData] = useState<CampaignEmail[]>([]);
	const [status, setStatus] = useState('all');
	const [campaignEmail, setCampaignEmail] = useState<CampaignEmail | null>(
		null
	);
	const [campaignType, setCampaignType] = useState<string | null>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const [showRetryDialog, setShowRetryDialog] = useState(false);
	const [hasFailedEmails, setHasFailedEmails] = useState(false);
	const [retryType, setRetryType] = useState<'all' | 'single'>('all');
	const [emailToRetry, setEmailToRetry] = useState<CampaignEmail | null>(
		null
	);

	// Close notice function
	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [notice]);

	// Initialize server-side table
	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	// Helper function to get campaign type
	const fetchCampaignType = async () => {
		if (campaignType) return campaignType; // Already cached

		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/campaigns/${id}`,
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
					__('Failed to determine campaign type', 'doublescale')
				);
			}

			// Use unified endpoint for all campaign types
			const response = (await apiFetch({
				path: addQueryArgs(`/doublescale/v1/campaigns/${id}/messages`, {
					per_page: perPage,
					page,
					status,
				}),
			})) as CampaignEmailsResponse;

			setTotalRecords(response.total);
			setData(response.data);

			// Check if there are any failed emails
			const hasFailed =
				response.data?.some(
					(email) => email.status_slug === 'failed'
				) || false;
			setHasFailedEmails(hasFailed);
		} catch (error: any) {
			setNotice({
				type: 'error',
				message:
					error.message || __('Failed to fetch messages', 'doublescale'),
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCampaignEmails();
	}, [page, perPage, status]);

	// Confirm retry sending
	const handleConfirmRetry = async () => {
		setShowRetryDialog(false);
		if (retryType === 'all') {
			await handleRetryAllFailed();
		} else {
			await handleRetrySingleEmail();
		}
	};

	// Resend ALL failed messages function (from analytics)
	const handleRetryAllFailed = async () => {
		try {
			if (!campaignType) {
				throw new Error('Campaign type not loaded');
			}

			setNotice({
				type: 'success',
				message: __(
					'Initiating resend process for all failed messages...',
					'doublescale'
				),
			});

			const endpoint = `/doublescale/v1/campaigns`;

			// Fetch current campaign data first
			const currentCampaign = (await apiFetch({
				path: `${endpoint}/${id}`,
			})) as any;

			// Update campaign status to 'resending' to trigger backend resend process
			await apiFetch({
				path: `${endpoint}/${id}`,
				method: 'PUT',
				data: {
					...currentCampaign,
					status: 'resending',
				},
			});

			setNotice({
				type: 'success',
				message: __(
					'Resend process initiated. All failed messages will be retried automatically.',
					'doublescale'
				),
			});

			// Refresh the list after a short delay to show updated status
			setTimeout(() => {
				fetchCampaignEmails();
			}, 2000);
		} catch (error: any) {
			setNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to initiate resend process', 'doublescale'),
			});
		}
	};

	// Resend single email function
	const handleRetrySingleEmail = async () => {
		if (!emailToRetry) return;

		try {
			setNotice({
				type: 'success',
				message: __('Resending email...', 'doublescale'),
			});

			// Resend single message via API endpoint
			await apiFetch({
				path: `/doublescale/v1/campaigns/${id}/messages/${emailToRetry.id}/resend`,
				method: 'POST',
			});

			setNotice({
				type: 'success',
				message: __('Email queued for resending!', 'doublescale'),
			});

			// Refresh the list after a short delay
			setTimeout(() => {
				fetchCampaignEmails();
			}, 2000);
		} catch (error: any) {
			setNotice({
				type: 'error',
				message:
					error.message || __('Failed to resend email', 'doublescale'),
			});
		}
	};

	// Get type-aware status options
	const getStatusOptions = () => {
		const baseOptions = [
			{ value: 'all', label: __('All', 'doublescale') },
			{ value: 'sent', label: __('Sent', 'doublescale') },
			{ value: 'failed', label: __('Failed', 'doublescale') },
		];

		if (campaignType === CAMPAIGN_CHANNEL.EMAIL) {
			return [
				...baseOptions,
				{ value: 'opened', label: __('Opened', 'doublescale') },
				{ value: 'clicked', label: __('Clicked', 'doublescale') },
			];
		} else if (campaignType === CAMPAIGN_CHANNEL.SMS) {
			return [
				...baseOptions,
				{ value: 'pending', label: __('Pending', 'doublescale') },
				{ value: 'delivered', label: __('Delivered', 'doublescale') },
				{ value: 'clicked', label: __('Clicked', 'doublescale') },
			];
		} else if (campaignType === CAMPAIGN_CHANNEL.WHATSAPP) {
			return [
				...baseOptions,
				{ value: 'pending', label: __('Pending', 'doublescale') },
				{ value: 'delivered', label: __('Delivered', 'doublescale') },
				{ value: 'read', label: __('Read', 'doublescale') },
				{ value: 'clicked', label: __('Clicked', 'doublescale') },
			];
		}

		return baseOptions;
	};

	// Handler to show retry dialog for individual message
	const handleResendMessage = async (messageToResend: CampaignEmail) => {
		setRetryType('single');
		setEmailToRetry(messageToResend);
		setShowRetryDialog(true);
	};

	// Handler to show retry dialog for all failed messages
	const handleRetryAllClick = () => {
		setRetryType('all');
		setEmailToRetry(null);
		setShowRetryDialog(true);
	};

	// Get columns
	const columns = getColumns({
		onViewTemplate: setCampaignEmail,
		onResendMessage: handleResendMessage,
		campaignType,
	});

	return (
		<>
			<div className="flex flex-col gap-5">
				{/* Header with status filter */}
				<div className="flex justify-between items-center">
					<h3 className="text-2xl font-semibold text-[#09090B]">
						{__('Emails', 'doublescale')}
					</h3>
					<div className="flex items-center gap-3">
						<span className="text-sm text-gray-600">
							{__('Filter by status:', 'doublescale')}
						</span>
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger className="w-[100px]">
								<SelectValue
									placeholder={__(
										'Select status',
										'doublescale'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{getStatusOptions().map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Notice Banner */}
				{notice && (
					<NoticeBanner
						ref={noticeBannerRef}
						notice={notice}
						closeNotice={closeNotice}
					/>
				)}

				{/* Warning Banner for Failed Emails */}
				{hasFailedEmails && !isLoading && (
					<div className="flex justify-between items-center border py-3 px-5 rounded-lg bg-[#FAEADF] border-[#CB5301]">
						<div className="flex items-center gap-2">
							<AlertIcon />
							<div className="text-base text-[#CB5301]">
								<div className="font-semibold">
									{__('Warning:', 'doublescale')}
								</div>
								<div>
									{__(
										`${data.filter((email) => email.status_slug === 'failed').length} Failed Email to send to recipients. try resending it again.`,
										'doublescale'
									)}
								</div>
							</div>
						</div>
						<Button
							variant="secondary"
							size="sm"
							className="bg-white"
							onClick={handleRetryAllClick}
						>
							<SendEmailsIcon />
							{__('Retry Sending', 'doublescale')}
						</Button>
					</div>
				)}

				{/* Messages Table */}
				<div>
					{!isLoading && data.length === 0 ? (
						<NoData
							icon={
								<ContactTotalEmailsIcon
									width={100}
									height={100}
								/>
							}
							title={__('No emails yet', 'doublescale')}
							subtitle={__(
								'Emails sent through this campaign will appear here.',
								'doublescale'
							)}
						/>
					) : (
						<>
							<DataTable
								columns={columns}
								data={data}
								loading={isLoading}
								showPagination={false}
								initialPageSize={10}
								showMainActions={false}
								config={{}}
								setPage={setPage}
							/>
							<DataTablePagination table={serverSideTable} />
						</>
					)}
				</div>
			</div>

			{/* Message Details Dialog */}
			<MessageDetails
				campaignEmail={campaignEmail}
				campaignType={campaignType}
				onClose={() => setCampaignEmail(null)}
				onResend={handleResendMessage}
			/>

			{/* Retry Sending Confirmation Dialog */}
			<AlertDialog
				open={showRetryDialog}
				onOpenChange={setShowRetryDialog}
			>
				<AlertDialogPortal>
					<AlertDialogOverlay className="z-[1800100]" />
					<AlertDialogContent className="max-w-[38rem] p-8 z-[1800100]">
						<AlertDialogHeader>
							<div className="flex flex-col items-center justify-center gap-6">
								<div className="flex items-center justify-center rounded-3xl p-5 bg-[#FAEADF] text-[#CB5301]">
									<BadConnectionIcon />
								</div>
								<AlertDialogTitle className="text-2xl font-bold text-[#09090B] text-center">
									{retryType === 'all'
										? __(
												'Retry Sending All Failed Emails?',
												'doublescale'
											)
										: __(
												'Retry Sending This Email?',
												'doublescale'
											)}
								</AlertDialogTitle>
								<AlertDialogDescription className="text-base text-center">
									{retryType === 'all'
										? __(
												'Are you sure you want to retry sending all failed emails in this campaign?',
												'doublescale'
											)
										: __(
												'Are you sure you want to retry sending this email?',
												'doublescale'
											)}
								</AlertDialogDescription>
							</div>
						</AlertDialogHeader>
						<AlertDialogFooter className="flex gap-2 mt-4">
							<AlertDialogCancel className="flex-1">
								{__('Cancel', 'doublescale')}
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleConfirmRetry}
								className="flex-1 bg-destructive hover:bg-destructive/90"
							>
								{__('Yes, Retry', 'doublescale')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogPortal>
			</AlertDialog>
		</>
	);
};

export default EmailsTab;
