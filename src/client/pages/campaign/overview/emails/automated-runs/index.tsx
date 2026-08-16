/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { ChevronDown, Calendar, Users, CheckCircle, XCircle, Eye, MousePointer, Clock, UserX } from 'lucide-react';

/**
 * Internal dependencies
 */
import type {
	CampaignEmail,
	CampaignEmailsResponse,
	Campaign,
	NoticeMessage,
} from '@doublescale/client';
import { useParams } from '@doublescale/navigation';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { getColumns } from '../columns';
import { getColumns as getUnsubColumns } from '../../unsubscribes/columns';
import MessageDetails from '../message-details-dialog';
import PageTabs from '@/components/page-tabs';
import {
	ContactTotalEmailsIcon,
	NoData,
	NoticeBanner,
	BadConnectionIcon,
	SendEmailsIcon,
	AlertIcon,
	UnsubscribesIcon,
	CampaignsIcon,
	FormattedDateCell,
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
import { Spinner } from '@/components/ui/spinner';
import { RenderChart } from '../../analytics/chart';

type RunSummary = {
	run_batch: string;
	run_start: string;
	run_end: string;
	total: number;
	sent: number;
	failed: number;
	opened: number;
	clicked: number;
	unsubscribed: number;
};

type RunsResponse = {
	data: RunSummary[];
	total: number;
	page: number;
};

const AutomatedRunsView: React.FC = () => {
	const { id } = useParams<{ id: string; subtab: string }>();

	const campaign = useSelect(
		(select: any) => select('doublescale/campaign').getCampaign(),
		[]
	) as Campaign | null;
	const campaignType = campaign?.type ?? null;

	const [isLoadingRuns, setIsLoadingRuns] = useState(true);
	const [runs, setRuns] = useState<RunSummary[]>([]);
	const [totalRuns, setTotalRuns] = useState(0);
	const [runsPage, setRunsPage] = useState(1);
	const [runsPerPage, setRunsPerPage] = useState(10);

	const [expandedRun, setExpandedRun] = useState<string | null>(null);
	const [runMessages, setRunMessages] = useState<CampaignEmail[]>([]);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [runMessagesTotal, setRunMessagesTotal] = useState(0);
	const [runMessagesPage, setRunMessagesPage] = useState(1);
	const [runMessagesPerPage, setRunMessagesPerPage] = useState(10);
	const [runMessagesStatus, setRunMessagesStatus] = useState('all');

	const [runUnsubscribes, setRunUnsubscribes] = useState<CampaignEmail[]>([]);
	const [isLoadingUnsubscribes, setIsLoadingUnsubscribes] = useState(false);
	const [runUnsubscribesTotal, setRunUnsubscribesTotal] = useState(0);
	const [runUnsubscribesPage, setRunUnsubscribesPage] = useState(1);
	const [runUnsubscribesPerPage, setRunUnsubscribesPerPage] = useState(10);

	const [activeSubTab, setActiveSubTab] = useState<string>('details');

	// Store the first message of the expanded batch for template preview
	const [batchFirstMessage, setBatchFirstMessage] = useState<CampaignEmail | null>(null);
	const [renderedBatchTemplate, setRenderedBatchTemplate] = useState<string>('');
	const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

	const [campaignEmail, setCampaignEmail] = useState<CampaignEmail | null>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const [showRetryDialog, setShowRetryDialog] = useState(false);
	const [retryType, setRetryType] = useState<'all' | 'single'>('all');
	const [emailToRetry, setEmailToRetry] = useState<CampaignEmail | null>(null);

	const closeNotice = () => setNotice(null);

	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [notice]);

	// Render the batch template via API when first message is loaded
	useEffect(() => {
		if (!batchFirstMessage) {
			setRenderedBatchTemplate('');
			return;
		}

		const templateId = batchFirstMessage.template?.id;
		if (!templateId) {
			const body = batchFirstMessage.template?.body
				|| (batchFirstMessage.activity?.data as any)?.body
				|| '';
			setRenderedBatchTemplate(typeof body === 'string' ? body : '');
			return;
		}

		const renderTemplate = async () => {
			setIsLoadingTemplate(true);
			try {
				const response: any = await apiFetch({
					path: `/doublescale/v1/templates/${templateId}/render`,
					method: 'POST',
					data: {
						preview: true,
					},
				});
				if (response?.html) {
					setRenderedBatchTemplate(response.html);
				} else {
					setRenderedBatchTemplate('');
				}
			} catch {
				setRenderedBatchTemplate('');
			} finally {
				setIsLoadingTemplate(false);
			}
		};

		renderTemplate();
	}, [batchFirstMessage]);

	const runsServerSideTable = useServerSideTable({
		page: runsPage,
		perPage: runsPerPage,
		totalRecords: totalRuns,
		setPage: setRunsPage,
		setPerPage: setRunsPerPage,
	});

	const messagesServerSideTable = useServerSideTable({
		page: runMessagesPage,
		perPage: runMessagesPerPage,
		totalRecords: runMessagesTotal,
		setPage: setRunMessagesPage,
		setPerPage: setRunMessagesPerPage,
	});

	const unsubscribesServerSideTable = useServerSideTable({
		page: runUnsubscribesPage,
		perPage: runUnsubscribesPerPage,
		totalRecords: runUnsubscribesTotal,
		setPage: setRunUnsubscribesPage,
		setPerPage: setRunUnsubscribesPerPage,
	});

	const fetchRuns = async () => {
		setIsLoadingRuns(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/doublescale/v1/campaigns/${id}/runs`, {
					per_page: runsPerPage,
					page: runsPage,
				}),
			})) as RunsResponse;

			setRuns(response.data);
			setTotalRuns(response.total);
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message || __('Failed to fetch campaign runs', 'doublescale'),
			});
		} finally {
			setIsLoadingRuns(false);
		}
	};

	useEffect(() => {
		fetchRuns();
	}, [runsPage, runsPerPage]);

	const fetchRunMessages = async (runBatch: string) => {
		setIsLoadingMessages(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/doublescale/v1/campaigns/${id}/runs/messages`, {
					run_batch: runBatch,
					per_page: runMessagesPerPage,
					page: runMessagesPage,
					status: runMessagesStatus,
				}),
			})) as CampaignEmailsResponse;

			setRunMessages(response.data);
			setRunMessagesTotal(response.total);

			// Store first message for template preview (only on first load)
			if (runMessagesPage === 1 && response.data.length > 0 && !batchFirstMessage) {
				setBatchFirstMessage(response.data[0]);
			}
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message || __('Failed to fetch run messages', 'doublescale'),
			});
		} finally {
			setIsLoadingMessages(false);
		}
	};

	// Fetch first message for the batch to get the template that was actually sent
	const fetchBatchFirstMessage = async (runBatch: string) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/doublescale/v1/campaigns/${id}/runs/messages`, {
					run_batch: runBatch,
					per_page: 1,
					page: 1,
				}),
			})) as CampaignEmailsResponse;

			if (response.data.length > 0) {
				setBatchFirstMessage(response.data[0]);
			}
		} catch {
			// Silently fail — template preview is optional
		}
	};

	const fetchRunUnsubscribes = async (runBatch: string) => {
		setIsLoadingUnsubscribes(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/doublescale/v1/campaigns/${id}/unsubscribes`, {
					run_batch: runBatch,
					per_page: runUnsubscribesPerPage,
					page: runUnsubscribesPage,
				}),
			})) as CampaignEmailsResponse;

			setRunUnsubscribes(response.data);
			setRunUnsubscribesTotal(response.total);
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message || __('Failed to fetch unsubscribes', 'doublescale'),
			});
		} finally {
			setIsLoadingUnsubscribes(false);
		}
	};

	useEffect(() => {
		if (expandedRun && activeSubTab === 'emails') {
			fetchRunMessages(expandedRun);
		}
	}, [expandedRun, activeSubTab, runMessagesPage, runMessagesPerPage, runMessagesStatus]);

	useEffect(() => {
		if (expandedRun && activeSubTab === 'unsubscribes') {
			fetchRunUnsubscribes(expandedRun);
		}
	}, [expandedRun, activeSubTab, runUnsubscribesPage, runUnsubscribesPerPage]);

	const handleToggleRun = (runBatch: string) => {
		if (expandedRun === runBatch) {
			setExpandedRun(null);
			setRunMessages([]);
			setRunMessagesTotal(0);
			setRunUnsubscribes([]);
			setRunUnsubscribesTotal(0);
			setBatchFirstMessage(null);
			setRenderedBatchTemplate('');
		} else {
			setExpandedRun(runBatch);
			setActiveSubTab('details');
			setRunMessagesPage(1);
			setRunMessagesStatus('all');
			setRunUnsubscribesPage(1);
			setBatchFirstMessage(null);
			setRenderedBatchTemplate('');
			fetchBatchFirstMessage(runBatch);
		}
	};

	const formatRunDateTime = (batchStr: string) => {
		const date = new Date(batchStr.replace(' ', 'T') + ':00');
		return date.toLocaleDateString(undefined, {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	const formatRunTime = (batchStr: string) => {
		const date = new Date(batchStr.replace(' ', 'T') + ':00');
		return date.toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const getRelativeLabel = (batchStr: string) => {
		const date = new Date(batchStr.replace(' ', 'T') + ':00');
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMins < 1) return __('Just now', 'doublescale');
		if (diffMins < 60) {
			return sprintf(
				_n('%d minute ago', '%d minutes ago', diffMins, 'doublescale'),
				diffMins
			);
		}
		if (diffHours < 24) {
			return sprintf(
				_n('%d hour ago', '%d hours ago', diffHours, 'doublescale'),
				diffHours
			);
		}
		if (diffDays === 0) return __('Today', 'doublescale');
		if (diffDays === 1) return __('Yesterday', 'doublescale');
		if (diffDays < 7) {
			return sprintf(
				_n('%d day ago', '%d days ago', diffDays, 'doublescale'),
				diffDays
			);
		}
		if (diffDays < 30) {
			const weeks = Math.floor(diffDays / 7);
			return sprintf(
				_n('%d week ago', '%d weeks ago', weeks, 'doublescale'),
				weeks
			);
		}
		return formatRunDateTime(batchStr);
	};

	const handleConfirmRetry = async () => {
		setShowRetryDialog(false);
		if (retryType === 'all') {
			await handleRetryAllFailed();
		} else {
			await handleRetrySingleEmail();
		}
	};

	const handleRetryAllFailed = async () => {
		try {
			setNotice({
				type: 'success',
				message: __('Initiating resend process for all failed messages...', 'doublescale'),
			});

			const currentCampaign = (await apiFetch({
				path: `/doublescale/v1/campaigns/${id}`,
			})) as any;

			await apiFetch({
				path: `/doublescale/v1/campaigns/${id}`,
				method: 'PUT',
				data: { ...currentCampaign, status: 'resending' },
			});

			setNotice({
				type: 'success',
				message: __('Resend process initiated. All failed messages will be retried automatically.', 'doublescale'),
			});

			setTimeout(() => {
				fetchRuns();
				if (expandedRun) fetchRunMessages(expandedRun);
			}, 2000);
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message || __('Failed to initiate resend process', 'doublescale'),
			});
		}
	};

	const handleRetrySingleEmail = async () => {
		if (!emailToRetry) return;
		try {
			setNotice({ type: 'success', message: __('Resending email...', 'doublescale') });

			await apiFetch({
				path: `/doublescale/v1/campaigns/${id}/messages/${emailToRetry.id}/resend`,
				method: 'POST',
			});

			setNotice({ type: 'success', message: __('Email queued for resending!', 'doublescale') });

			setTimeout(() => {
				if (expandedRun) fetchRunMessages(expandedRun);
				fetchRuns();
			}, 2000);
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message || __('Failed to resend email', 'doublescale'),
			});
		}
	};

	const handleResendMessage = async (messageToResend: CampaignEmail) => {
		setRetryType('single');
		setEmailToRetry(messageToResend);
		setShowRetryDialog(true);
	};

	const columns = getColumns({
		onViewTemplate: setCampaignEmail,
		onResendMessage: handleResendMessage,
		campaignType,
	});

	const unsubColumns = getUnsubColumns(campaignType ?? undefined);

	const batchSubject = batchFirstMessage?.template?.subject
		|| (batchFirstMessage?.activity?.data as any)?.subject
		|| '';

	const renderBatchCampaignDetails = (run: RunSummary) => (
		<div className="space-y-6 p-5">
			{/* Campaign Info */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1">
					<span className="text-base text-gray-500">
						{__('Title', 'doublescale')}
					</span>
					<p className="text-base font-semibold text-foreground">
						{campaign?.name}
					</p>
				</div>

				{batchSubject && (
					<div className="space-y-1">
						<span className="text-base text-gray-500">
							{__('Subject', 'doublescale')}
						</span>
						<p className="text-base font-semibold text-foreground">
							{batchSubject}
						</p>
					</div>
				)}

				<div className="space-y-1">
					<span className="text-base text-gray-500">
						{__('Executed On', 'doublescale')}
					</span>
					<p className="text-base font-semibold text-foreground">
						<FormattedDateCell value={run.run_start} />
					</p>
				</div>

				<div className="space-y-1">
					<span className="text-base text-gray-500">
						{__('Total Recipients', 'doublescale')}
					</span>
					<p className="text-base font-semibold text-foreground">
						{run.total}
					</p>
				</div>
			</div>

			{/* Stats Chart */}
			<div className="border-t pt-4">
				<RenderChart
					chartData={{
						labels: [
							__('Sent Emails', 'doublescale'),
							__('Open Rate', 'doublescale'),
							__('Click Rate', 'doublescale'),
							__('Failed Emails', 'doublescale'),
						],
						data: [run.sent, run.opened, run.clicked, run.failed],
						colors: ['#458DC7', '#16A34A', '#660FF1', '#E13B3B'],
					}}
				/>
			</div>

			{/* Email Template Preview — rendered from the actual sent email */}
			<div className="space-y-3 border-t pt-4">
				<h3 className="text-2xl font-medium">
					{__('Email Template', 'doublescale')}
				</h3>
				<div className="space-y-4 bg-[#E3EEFF99] p-4 rounded-lg border">
					{isLoadingTemplate ? (
						<div className="flex items-center justify-center py-8 text-gray-500">
							{__('Loading template...', 'doublescale')}
						</div>
					) : renderedBatchTemplate ? (
						<div
							className="template-body-preview"
							dangerouslySetInnerHTML={{ __html: renderedBatchTemplate }}
						/>
					) : (
						<div className="flex items-center justify-center py-8 text-gray-500">
							{__('No template preview available', 'doublescale')}
						</div>
					)}
				</div>
			</div>
		</div>
	);

	const renderBatchEmails = (run: RunSummary) => (
		<div>
			{run.failed > 0 && (
				<div className="flex justify-between items-center py-2.5 px-4 bg-[#FAEADF] border-b border-[#CB5301]">
					<div className="flex items-center gap-2">
						<AlertIcon />
						<span className="text-sm text-[#CB5301] font-medium">
							{run.failed} {__('failed email(s) in this run', 'doublescale')}
						</span>
					</div>
					<Button
						variant="secondary"
						size="sm"
						className="bg-white text-xs"
						onClick={() => {
							setRetryType('all');
							setEmailToRetry(null);
							setShowRetryDialog(true);
						}}
					>
						<SendEmailsIcon />
						{__('Retry Failed', 'doublescale')}
					</Button>
				</div>
			)}

			<div className="p-4">
				{isLoadingMessages ? (
					<div className="flex items-center justify-center py-8">
						<Spinner className="size-5" />
					</div>
				) : runMessages.length === 0 ? (
					<div className="text-center py-8 text-gray-500 text-sm">
						{__('No messages found for this run.', 'doublescale')}
					</div>
				) : (
					<>
						<DataTable
							columns={columns}
							data={runMessages}
							loading={isLoadingMessages}
							showPagination={false}
							initialPageSize={10}
							showMainActions={false}
							config={{}}
							setPage={setRunMessagesPage}
						/>
						<DataTablePagination table={messagesServerSideTable} />
					</>
				)}
			</div>
		</div>
	);

	const renderBatchUnsubscribes = () => (
		<div className="p-4">
			{isLoadingUnsubscribes ? (
				<div className="flex items-center justify-center py-8">
					<Spinner className="size-5" />
				</div>
			) : runUnsubscribes.length === 0 ? (
				<NoData
					icon={<UnsubscribesIcon width={48} height={48} />}
					title={__('No unsubscribes', 'doublescale')}
					subtitle={__('No contacts unsubscribed from this run.', 'doublescale')}
				/>
			) : (
				<>
					<DataTable
						columns={unsubColumns}
						data={runUnsubscribes}
						loading={isLoadingUnsubscribes}
						showPagination={false}
						initialPageSize={10}
						showMainActions={false}
						config={{}}
						setPage={setRunUnsubscribesPage}
					/>
					<DataTablePagination table={unsubscribesServerSideTable} />
				</>
			)}
		</div>
	);

	const getBatchTabsList = (run: RunSummary) => [
		{
			value: 'details',
			label: __('Campaign Details', 'doublescale'),
			icon: <CampaignsIcon width={20} height={20} />,
		},
		{
			value: 'emails',
			label: __('Emails', 'doublescale'),
			icon: <ContactTotalEmailsIcon width={20} height={20} />,
		},
		{
			value: 'unsubscribes',
			label: __('Unsubscribes', 'doublescale') + (run.unsubscribed > 0 ? ` (${run.unsubscribed})` : ''),
			icon: <UnsubscribesIcon width={20} height={20} />,
		},
	];

	const getBatchTabsContent = (run: RunSummary) => [
		{
			value: 'details',
			children: renderBatchCampaignDetails(run),
		},
		{
			value: 'emails',
			children: renderBatchEmails(run),
		},
		{
			value: 'unsubscribes',
			children: renderBatchUnsubscribes(),
		},
	];

	return (
		<>
			<div className="flex flex-col gap-5">
				<div className="flex justify-between items-center">
					<h3 className="text-2xl font-semibold text-foreground">
						{__('Emails', 'doublescale')}
					</h3>
					<div className="flex items-center gap-2 text-sm text-gray-500">
						<Calendar className="w-4 h-4" />
						{totalRuns} {totalRuns === 1 ? __('run', 'doublescale') : __('runs', 'doublescale')}
					</div>
				</div>

				{notice && (
					<NoticeBanner
						ref={noticeBannerRef}
						notice={notice}
						closeNotice={closeNotice}
					/>
				)}

				{isLoadingRuns ? (
					<div className="flex items-center justify-center py-8">
						<Spinner className="size-6" />
					</div>
				) : runs.length === 0 ? (
					<NoData
						icon={<ContactTotalEmailsIcon width={64} height={64} />}
						title={__('No execution runs yet', 'doublescale')}
						subtitle={__(
							'Emails sent through this automated campaign will appear here grouped by execution run.',
							'doublescale'
						)}
						className="justify-start py-6"
					/>
				) : (
					<div className="flex flex-col gap-3">
						{runs.map((run, index) => {
							const isExpanded = expandedRun === run.run_batch;
							const successRate = run.total > 0 ? Math.round((run.sent / run.total) * 100) : 0;

							return (
								<div
									key={run.run_batch}
									className="border rounded-lg overflow-hidden bg-white"
								>
									<button
										onClick={() => handleToggleRun(run.run_batch)}
										className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
									>
										<div className="flex items-center gap-3">
											<div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
												<ChevronDown className="w-5 h-5 text-gray-400" />
											</div>
											<div className="flex items-center gap-2 bg-primary/10 text-primary px-2.5 py-1 rounded-md text-sm font-semibold">
												#{totalRuns - ((runsPage - 1) * runsPerPage) - index}
											</div>
											<div className="flex flex-col items-start gap-0.5">
												<span className="text-base font-semibold text-foreground">
													{formatRunDateTime(run.run_batch)}
												</span>
												<div className="flex items-center gap-1.5 text-sm text-gray-500">
													<Clock className="w-3.5 h-3.5" />
													<span>{formatRunTime(run.run_batch)}</span>
													<span className="text-gray-300 mx-0.5">·</span>
													<span>{getRelativeLabel(run.run_batch)}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-5">
											<div className="flex items-center gap-1.5 text-sm">
												<Users className="w-4 h-4 text-gray-400" />
												<span className="text-gray-600 font-medium">{run.total}</span>
											</div>
											<div className="flex items-center gap-1.5 text-sm">
												<CheckCircle className="w-4 h-4 text-[#16A34A]" />
												<span className="text-[#16A34A] font-medium">{run.sent}</span>
											</div>
											{run.failed > 0 && (
												<div className="flex items-center gap-1.5 text-sm">
													<XCircle className="w-4 h-4 text-destructive" />
													<span className="text-destructive font-medium">{run.failed}</span>
												</div>
											)}
											{campaignType === CAMPAIGN_CHANNEL.EMAIL && (
												<>
													<div className="flex items-center gap-1.5 text-sm">
														<Eye className="w-4 h-4 text-blue-500" />
														<span className="text-blue-600 font-medium">{run.opened}</span>
													</div>
													<div className="flex items-center gap-1.5 text-sm">
														<MousePointer className="w-4 h-4 text-purple-500" />
														<span className="text-purple-600 font-medium">{run.clicked}</span>
													</div>
												</>
											)}
											{run.unsubscribed > 0 && (
												<div className="flex items-center gap-1.5 text-sm">
													<UserX className="w-4 h-4 text-orange-500" />
													<span className="text-orange-600 font-medium">{run.unsubscribed}</span>
												</div>
											)}
											<div
												className={`text-xs font-medium px-2 py-0.5 rounded-full ${
													successRate >= 90
														? 'bg-[#EFFFF5] text-[#16A34A]'
														: successRate >= 50
															? 'bg-yellow-50 text-yellow-600'
															: 'bg-[#EF444429] text-destructive'
												}`}
											>
												{successRate}%
											</div>
										</div>
									</button>

									{isExpanded && (
										<div className="border-t bg-muted/50">
											<PageTabs
												defaultValue="details"
												value={activeSubTab}
												onValueChange={(val) => setActiveSubTab(val)}
												tabsList={getBatchTabsList(run)}
												tabsContent={getBatchTabsContent(run)}
												className="w-full"
												tabsListWrapperClassName="border-b pb-4 pt-5 px-5"
												tabsListClassName="bg-transparent text-foreground gap-2 justify-start w-full"
											/>
										</div>
									)}
								</div>
							);
						})}

						{totalRuns > runsPerPage && (
							<DataTablePagination table={runsServerSideTable} />
						)}
					</div>
				)}
			</div>

			<MessageDetails
				campaignEmail={campaignEmail}
				campaignType={campaignType}
				onClose={() => setCampaignEmail(null)}
				onResend={handleResendMessage}
			/>

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
								<AlertDialogTitle className="text-2xl font-bold text-foreground text-center">
									{retryType === 'all'
										? __('Retry Sending All Failed Emails?', 'doublescale')
										: __('Retry Sending This Email?', 'doublescale')}
								</AlertDialogTitle>
								<AlertDialogDescription className="text-base text-center">
									{retryType === 'all'
										? __('Are you sure you want to retry sending all failed emails in this campaign?', 'doublescale')
										: __('Are you sure you want to retry sending this email?', 'doublescale')}
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

export default AutomatedRunsView;
