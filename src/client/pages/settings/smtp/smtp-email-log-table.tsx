/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	Dialog,
	DialogContent,
} from '@/components/ui/dialog';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { EmailLogRow } from './types';
import {
	deleteSmtpEmailLog,
	deleteSmtpEmailLogsByIds,
} from './smtp-api';
import { ViewIcon } from '@doublescale/components';
import TrashIcon from '@/components/icons/trash';
import AccordingRightIcon from '@/components/icons/according-right';
import SearchIcon from '@/components/icons/search';


const BODY_PREVIEW_MAX = 12000;

function parseLogDate(value: unknown): Date | null {
	const raw = stringifyLogValue(value).trim();
	if (!raw) {
		return null;
	}
	const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
	const parsed = new Date(normalized);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function rowLogId(row: EmailLogRow): number | null {
	if (row.log_id == null) {
		return null;
	}
	const n = Number(row.log_id);
	return Number.isFinite(n) && n > 0 ? n : null;
}

function stringifyLogValue(value: unknown): string {
	if (value === null || value === undefined) {
		return '';
	}
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function statusBadgeClass(status: string): string {
	const normalized = status.trim().toLowerCase();
	if (normalized === 'sent' || normalized === 'succeeded') {
		return 'bg-[#E4FAEC] text-[#16A34A] text-sm font-medium leading-6 py-1 px-2 rounded-[8px]';
	}
	if (normalized === 'failed' || normalized === 'error') {
		return 'bg-[#FBE8E8] text-[#C30A0A] text-sm font-medium leading-6 py-1 px-2 rounded-[8px]';
	}
	return 'bg-[#E5E7EB] text-[#4B5563]';
}

function formatLogTimestamp(value: unknown): string {
	const raw = stringifyLogValue(value).trim();
	if (!raw) {
		return '—';
	}

	const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
	const date = new Date(normalized);
	if (Number.isNaN(date.getTime())) {
		return raw;
	}

	const day = String(date.getDate()).padStart(2, '0');
	const month = date.toLocaleString('en-US', { month: 'short' });
	const year = date.getFullYear();
	const hours24 = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const period = hours24 >= 12 ? 'pm' : 'am';
	const hours12 = hours24 % 12 || 12;

	return `${day} ${month}, ${year} - ${hours12}:${minutes} ${period}`;
}

export type SmtpLogFilter = 'all' | 'succeeded' | 'failed';

type LogFilter = SmtpLogFilter;

function matchesLogFilter(row: EmailLogRow, filter: LogFilter): boolean {
	if (filter === 'all') {
		return true;
	}

	const status = String(row.status ?? '').trim().toLowerCase();
	if (filter === 'succeeded') {
		return status === 'succeeded' || status === 'sent' || status === 'success';
	}
	return status === 'failed' || status === 'error';
}

function buildDetailFields(row: EmailLogRow): DetailField[] {
	const r = row as Record<string, unknown>;
	const push = (label: string, key: string) => {
		const raw = r[key];
		if (raw === null || raw === undefined || raw === '') {
			return;
		}
		const str = stringifyLogValue(raw);
		if (str.trim() === '') {
			return;
		}
		out.push({ label, value: str });
	};
	const out: DetailField[] = [];

	// push(__('Log ID', 'doublescale'), 'log_id');
	push(__('Time (local)', 'doublescale'), 'timestamp');
	push(__('Time (GMT)', 'doublescale'), 'datetime');
	push(__('Status', 'doublescale'), 'status');
	push(__('Subject', 'doublescale'), 'subject');
	push(__('From', 'doublescale'), 'from');
	(() => {
		const recipients = r.recipients;
		if (!recipients) {
			return;
		}
		if (typeof recipients === 'string') {
			const str = recipients.trim();
			if (str) {
				out.push({ label: __('To', 'doublescale'), value: str });
			}
			return;
		}
		if (typeof recipients !== 'object') {
			const str = stringifyLogValue(recipients).trim();
			if (str) {
				out.push({ label: __('Recipients', 'doublescale'), value: str });
			}
			return;
		}

		const rec = recipients as Record<string, unknown>;
		const keys: Array<[string, string]> = [
			['to', __('To', 'doublescale')],
			['cc', __('CC', 'doublescale')],
			['bcc', __('BCC', 'doublescale')],
			['reply-to', __('Reply-To', 'doublescale')],
			['reply_to', __('Reply-To', 'doublescale')],
		];

		keys.forEach(([key, label]) => {
			const value = rec[key];
			if (value === null || value === undefined || value === '') {
				return;
			}
			const str = stringifyLogValue(value).trim();
			if (!str) {
				return;
			}
			const exists = out.some((field) => field.label === label && field.value === str);
			if (!exists) {
				out.push({ label, value: str });
			}
		});
	})();
	push(__('Provider slug', 'doublescale'), 'provider');
	push(__('Provider name', 'doublescale'), 'provider_name');
	// push(__('Connection ID', 'doublescale'), 'connection_id');
	push(__('Connection name', 'doublescale'), 'connection_name');
	// push(__('Account ID', 'doublescale'), 'account_id');
	push(__('Account name', 'doublescale'), 'account_name');
	push(__('Initiator', 'doublescale'), 'initiator_name');
	push(__('Initiator slug', 'doublescale'), 'initiator_slug');
	push(__('Initiator type', 'doublescale'), 'initiator_type');
	push(__('CRM source', 'doublescale'), 'source_label');
	push(__('CRM link', 'doublescale'), 'source_link');
	push(__('Resend count', 'doublescale'), 'resend_count');

	return out;
}

function formatBodyForModal(body: string): { text: string; truncated: boolean } {
	if (!body) {
		return { text: '', truncated: false };
	}
	if (body.length <= BODY_PREVIEW_MAX) {
		return { text: body, truncated: false };
	}
	return {
		text:
			body.slice(0, BODY_PREVIEW_MAX) +
			'\n\n… ' +
			sprintf(
				/* translators: %d: number of omitted characters */
				__('(%d more characters omitted)', 'doublescale'),
				body.length - BODY_PREVIEW_MAX
			),
		truncated: true,
	};
}

export type SmtpEmailLogControlledFilters = {
	activeFilter: SmtpLogFilter;
	onActiveFilterChange: (next: SmtpLogFilter) => void;
	searchQuery: string;
	onSearchQueryChange: (next: string) => void;
	dateRange: { from: Date | null; to: Date | null };
	onDateRangeChange: (next: {
		from: Date | null;
		to: Date | null;
	}) => void;
};

export type SmtpEmailLogTableProps = {
	logs: EmailLogRow[];
	/** When set, filter controls are controlled by the parent and rows are server-filtered. */
	controlledFilters?: SmtpEmailLogControlledFilters;
	/** Loading state for server-backed log fetches (disables inputs, shows table hint). */
	logLoading?: boolean;
	/** Called after a row is deleted so the parent can refetch. */
	onLogsMutated?: () => void | Promise<void>;
	/** Show delete / API errors in the parent (e.g. alert banner). */
	onActionError?: (message: string) => void;
	onSelectedCountChange?: (count: number) => void;
	onBulkDeletingChange?: (busy: boolean) => void;
	onDeleteSelectedActionChange?: (action: (() => void) | null) => void;
};

const SmtpEmailLogTable: React.FC<SmtpEmailLogTableProps> = ({
	logs,
	controlledFilters,
	logLoading = false,
	onLogsMutated,
	onActionError,
	onSelectedCountChange,
	onBulkDeletingChange,
	onDeleteSelectedActionChange,
}) => {
	const [detailRow, setDetailRow] = useState<EmailLogRow | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
	const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
	const [bulkDeleting, setBulkDeleting] = useState(false);
	const [internalActiveFilter, setInternalActiveFilter] =
		useState<LogFilter>('all');
	const [internalSearchQuery, setInternalSearchQuery] = useState('');
	const [internalDateRange, setInternalDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
	});

	const activeFilter =
		controlledFilters?.activeFilter ?? internalActiveFilter;
	const setActiveFilter =
		controlledFilters?.onActiveFilterChange ?? setInternalActiveFilter;
	const searchQuery =
		controlledFilters?.searchQuery ?? internalSearchQuery;
	const setSearchQuery =
		controlledFilters?.onSearchQueryChange ?? setInternalSearchQuery;
	const dateRange = controlledFilters?.dateRange ?? internalDateRange;
	const setDateRange =
		controlledFilters?.onDateRangeChange ?? setInternalDateRange;

	const showFilterChrome = Boolean(controlledFilters) || logs.length > 0;

	const filteredLogs = useMemo(() => {
		if (controlledFilters) {
			return logs;
		}
		return logs.filter((row) => {
				if (!matchesLogFilter(row, activeFilter)) {
					return false;
				}

				const query = searchQuery.trim().toLowerCase();
				if (query) {
					const haystack = [
						row.subject,
						row.status,
						row.timestamp,
						row.provider,
						row.source_label,
						(row as Record<string, unknown>).from,
						(row as Record<string, unknown>).recipients,
					]
						.map((v) => stringifyLogValue(v).toLowerCase())
						.join(' ');

					if (!haystack.includes(query)) {
						return false;
					}
				}

				if (dateRange.from || dateRange.to) {
					const logDate = parseLogDate(row.timestamp);
					if (!logDate) {
						return false;
					}

					if (dateRange.from) {
						const from = new Date(dateRange.from);
						from.setHours(0, 0, 0, 0);
						if (logDate < from) {
							return false;
						}
					}

					if (dateRange.to) {
						const to = new Date(dateRange.to);
						to.setHours(23, 59, 59, 999);
						if (logDate > to) {
							return false;
						}
					}
				}
				return true;
			});
	}, [
		activeFilter,
		controlledFilters,
		dateRange.from,
		dateRange.to,
		logs,
		searchQuery,
	]);

	const pageIds = useMemo(
		() =>
			filteredLogs
				.map((row) => rowLogId(row))
				.filter((id): id is number => id != null),
		[filteredLogs]
	);

	const allSelected =
		pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
	const someSelected =
		!allSelected && pageIds.some((id) => selectedIds.has(id));

	useEffect(() => {
		const valid = new Set(pageIds);
		setSelectedIds((prev) => {
			const next = new Set<number>();
			prev.forEach((id) => {
				if (valid.has(id)) {
					next.add(id);
				}
			});
			return next;
		});
	}, [pageIds]);

	useEffect(() => {
		onSelectedCountChange?.(selectedIds.size);
	}, [onSelectedCountChange, selectedIds]);

	useEffect(() => {
		onBulkDeletingChange?.(bulkDeleting);
	}, [bulkDeleting, onBulkDeletingChange]);

	useEffect(() => {
		if (!onDeleteSelectedActionChange) {
			return;
		}
		if (selectedIds.size === 0 || bulkDeleting) {
			onDeleteSelectedActionChange(null);
			return;
		}
		onDeleteSelectedActionChange(() => () => setBulkDialogOpen(true));
		return () => {
			onDeleteSelectedActionChange(null);
		};
	}, [bulkDeleting, onDeleteSelectedActionChange, selectedIds.size]);

	const handleDeleteRow = async (row: EmailLogRow) => {
		const id = rowLogId(row);
		if (id == null) {
			return;
		}
		setDeletingId(id);
		try {
			await deleteSmtpEmailLog(id);
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
			if (detailRow && rowLogId(detailRow) === id) {
				setDetailRow(null);
			}
			await onLogsMutated?.();
		} catch (e: unknown) {
			onActionError?.(
				e instanceof Error
					? e.message
					: __('Could not delete log entry.', 'doublescale')
			);
		} finally {
			setDeletingId(null);
		}
	};

	const handleBulkDelete = async () => {
		const ids = Array.from(selectedIds);
		if (ids.length === 0) {
			return;
		}
		setBulkDeleting(true);
		try {
			await deleteSmtpEmailLogsByIds(ids);
			setSelectedIds(new Set());
			setBulkDialogOpen(false);
			setDetailRow(null);
			await onLogsMutated?.();
		} catch (e: unknown) {
			onActionError?.(
				e instanceof Error
					? e.message
					: __('Could not delete selected log entries.', 'doublescale')
			);
		} finally {
			setBulkDeleting(false);
		}
	};

	return (
		<>
			{showFilterChrome && (
				<div className="mb-6 flex items-end gap-10 border-b border-[#D0D0D0] px-4">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setActiveFilter('all')}
						className={`px-0 pt-3 pb-4 h-auto rounded-none text-sm font-medium ${
							activeFilter === 'all'
								? 'text-brandPrimary border-b-2 border-brandPrimary'
								: 'text-[#29292E]'
						}`}
					>
						{__('All Logs', 'doublescale')}
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setActiveFilter('succeeded')}
						className={`px-0 pt-3 pb-4 h-auto rounded-none text-sm font-medium ${
							activeFilter === 'succeeded'
								? 'text-brandPrimary border-b-2 border-brandPrimary'
								: 'text-[#29292E]'
						}`}
					>
						{__('Successful', 'doublescale')}
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setActiveFilter('failed')}
						className={`px-0 pt-3 pb-4 h-auto rounded-none text-sm font-medium ${
							activeFilter === 'failed'
								? 'text-brandPrimary border-b-2 border-brandPrimary'
								: 'text-[#29292E]'
						}`}
					>
						{__('Failed', 'doublescale')}
					</Button>
				</div>
			)}
			{showFilterChrome && (
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
					<div className="w-full max-w-[480px]">
						<div className="relative">
							<span
								className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9EA2A9]"
								
							>
								<SearchIcon/>
							</span>
							
							<Input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.currentTarget.value)}
								placeholder={__('Search by title...', 'doublescale')}
								disabled={logLoading}
								className="h-10 !rounded-lg !border-[#D0D0D0] bg-[#fff] !pl-[44px] text-sm placeholder:text-[#777] focus-visible:ring-0 focus-visible:border-[#D0D0D0]"
							/>
						</div>
					</div>
					<DateRangePicker
						value={dateRange}
						onChange={setDateRange}
						placeholder={__('Date Range', 'doublescale')}
						className="h-10 py-1 px-2 w-fit rounded-lg border-[#D0D0D0] bg-[#F7F8FA] text-sm font-medium text-[#29292E]"
					/>
				</div>
			)}

			<div className="rounded-2xl border border-[#D0D0D0] overflow-hidden bg-white">
				<Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-4 [&_thead_th]:text-sm [&_thead_th]:font-medium [&_thead_th]:leading-6 [&_thead_th]:text-[#29292E] [&_thead_th]:normal-case [&_thead_th]:tracking-normal [&_tbody_td]:text-sm [&_tbody_td]:font-medium [&_tbody_td]:leading-6 [&_tbody_td]:text-[#29292E]">
					<TableHeader className="bg-[#F5F5F5]">
						<TableRow className="hover:bg-transparent  border-[#D0D0D0]">
						<TableHead className="w-[44px] ">
							<div className="flex justify-center">
								<Checkbox
									aria-label={__('Select all on this page', 'doublescale')}
									className="border-[#D6D6DE] bg-[#F3F3F6] data-[state=checked]:bg-brandPrimary data-[state=checked]:border-0 data-[state=checked]:text-white"
									checked={
										allSelected
											? true
											: someSelected
												? 'indeterminate'
												: false
									}
									onCheckedChange={(checked) => {
										setSelectedIds((prev) => {
											const next = new Set(prev);
											if (checked === true) {
												pageIds.forEach((id) => next.add(id));
											} else {
												pageIds.forEach((id) => next.delete(id));
											}
											return next;
										});
									}}
								/>
							</div>
						</TableHead>
						<TableHead>{__('Subject', 'doublescale')}</TableHead>
						<TableHead>{__('Status', 'doublescale')}</TableHead>
						<TableHead>{__('Time', 'doublescale')}</TableHead>
						<TableHead>{__('CRM source', 'doublescale')}</TableHead>
						<TableHead>{__('Provider', 'doublescale')}</TableHead>
						<TableHead>{__('Response', 'doublescale')}</TableHead>
						<TableHead className=" text-center" >
								{__('Actions', 'doublescale')}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredLogs.length === 0 ? (
						<TableRow className="bg-white hover:bg-white">
							<TableCell colSpan={8} className="py-12 text-center text-sm text-[#6B6C76]">
								{logLoading
									? __('Loading log…', 'doublescale')
									: searchQuery.trim() ||
											dateRange.from ||
											dateRange.to ||
											activeFilter !== 'all'
										? __('No logs match the selected filters.', 'doublescale')
										: __('No log rows found.', 'doublescale')}
							</TableCell>
						</TableRow>
					) : (
						filteredLogs.map((row, idx) => {
						const responseRaw = (row as Record<string, unknown>).response;
						const responseText =
							responseRaw == null
								? ''
								: typeof responseRaw === 'string'
									? responseRaw
									: stringifyLogValue(responseRaw);
						const displayResponse =
							responseText.length > 120
								? `${responseText.slice(0, 117)}…`
								: responseText;
						const sourceLink =
							typeof row.source_link === 'string'
								? row.source_link.trim()
								: '';
						const sourceLabel =
							typeof row.source_label === 'string'
								? row.source_label.trim()
								: '';
						const rowId = rowLogId(row);
						const isSelected = rowId != null && selectedIds.has(rowId);
						return (
							<TableRow
								key={
									row.log_id != null
										? String(row.log_id)
										: `log-row-${idx}`
								}
								className={`border-[#D0D0D0]  hover:bg-[#ECEEF2] ${
									idx % 2 === 0 ? 'bg-[#fff]' : 'bg-[#F7F8FA]'
								}`}
							>
								<TableCell className="w-[44px]  align-middle">
									<div className="flex justify-center">
										<Checkbox
											aria-label={sprintf(
												/* translators: %s: log id */
												__('Select log #%s', 'doublescale'),
												rowId != null ? String(rowId) : '—'
											)}
											className="border-[#D6D6DE] bg-[#F3F3F6] data-[state=checked]:bg-brandPrimary data-[state=checked]:border-0 data-[state=checked]:text-white"
											disabled={rowId == null}
											checked={isSelected}
											onCheckedChange={(checked) => {
												if (rowId == null) {
													return;
												}
												setSelectedIds((prev) => {
													const next = new Set(prev);
													if (checked === true) {
														next.add(rowId);
													} else {
														next.delete(rowId);
													}
													return next;
												});
											}}
										/>
									</div>
								</TableCell>
								<TableCell className="max-w-[260px] truncate align-middle ">
									{row.subject ?? '—'}
								</TableCell>
								<TableCell className="align-middle">
									<span
										className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
											String(row.status ?? '')
										)}`}
									>
										{row.status ?? '—'}
									</span>
								</TableCell>
								<TableCell className="whitespace-nowrap align-middle ">
									{formatLogTimestamp(row.timestamp)}
								</TableCell>
								
								<TableCell className="max-w-[220px] align-middle  ">
									{sourceLink && sourceLabel ? (
										<a
											href={sourceLink}
											className="text-brandPrimary underline-offset-2 hover:underline"
											target="_blank"
											rel="noreferrer"
										>
											{sourceLabel}
										</a>
									) : sourceLabel ? (
										<span className="text-muted-foreground">
											{sourceLabel}
										</span>
									) : (
										'—'
									)}
								</TableCell>
								<TableCell className="align-middle ">
									{row.provider ?? '—'}
								</TableCell>
								<TableCell
									className="max-w-md truncate align-middle"
									title={responseText || undefined}
								>
									{responseText ? displayResponse : '—'}
								</TableCell>
								<TableCell className="p-1 text-center">
									<div className="flex items-center justify-center gap-0.5">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className=" text-[#0D9DFC] "
											aria-label={__(
												'View full log details',
												'doublescale'
											)}
											onClick={() => setDetailRow(row)}
										>
											<ViewIcon width={24} height={24} />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className=" text-[#C30A0A]"
											disabled={
												rowId == null || deletingId === rowId
											}
											aria-label={__(
												'Delete this log entry',
												'doublescale'
											)}
											onClick={() => void handleDeleteRow(row)}
										>
											<TrashIcon width={24} height={24} />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						);
						})
					)}
				</TableBody>
			</Table>
			</div>

			<AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{__('Delete selected log entries?', 'doublescale')}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{sprintf(
								/* translators: %d: number of logs */
								__(
									'This will permanently remove %d selected row(s) from the SMTP email log.',
									'doublescale'
								),
								selectedIds.size
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={bulkDeleting}>
							{__('Cancel', 'doublescale')}
						</AlertDialogCancel>
						<Button
							type="button"
							variant="destructive"
							disabled={bulkDeleting}
							onClick={() => void handleBulkDelete()}
						>
							{bulkDeleting
								? __('Deleting…', 'doublescale')
								: __('Delete', 'doublescale')}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog
				open={detailRow !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDetailRow(null);
					}
				}}
			>
				<DialogContent className="!left-0 !top-0 !translate-x-0 !translate-y-0 !w-screen !max-w-none !h-screen !rounded-none !border-0 !p-0 overflow-y-auto  bg-[#F7F8FA]">
					{detailRow && (
						<div className="min-h-screen flex flex-col">
							<div className=" rounded-t-lg bg-[#fff] py-2 px-6 pr-14 flex items-center gap-2.5">
								     <p className="text-sm font-medium text-[#29292E] leading-7">
								    {__('Logs', 'doublescale')}</p>
									 <AccordingRightIcon />
									<span className="text-[#6B6C76] leading-7">{__('Log Details', 'doublescale')} </span>
							</div>

							<div className="m-6  rounded-[20px]  bg-[#fff] p-4 shadow-[0px_8px_30px_0px_rgba(59,130,246,0.12)]">
								<div className="mx-auto space-y-6 w-full rounded-2xl border border-[#D0D0D0] bg-[#F7F8FA] p-6 ">
									<div className="rounded-xl border border-[#D0D0D0] bg-white p-6">
										<h3 className="mb-6 text-xl font-semibold leading-8 text-[#29292E]">
											{__('Log Details', 'doublescale')}
										</h3>
										<dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm md:grid-cols-2">
											{buildDetailFields(detailRow).map(({ label, value }) => {
												const isStatusField = label === __('Status', 'doublescale');
												return (
													<div key={label} className="flex gap-2">
														<dt className="text-[#777] leading-7 shrink-0">{label}:</dt>

														<dd className="break-words whitespace-pre-wrap text-[#29292E] leading-7 font-semibold">
															{isStatusField ? (
																<span
																	className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
																		String(value ?? '')
																	)}`}
																>
																	{value}
																</span>
															) : (
																value
															)}
														</dd>
													</div>
												);
											})}
										</dl>
									</div>

									<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
										{(() => {
											const body = String((detailRow as Record<string, unknown>).body ?? '');
											const { text, truncated } = formatBodyForModal(body);
											return (
												<div className="rounded-xl border border-[#D0D0D0] bg-white p-6">
													<h4 className="mb-6 text-xl font-semibold leading-8 text-[#29292E]">
														{truncated
															? __('Email Body (preview)', 'doublescale')
															: __('Email Body', 'doublescale')}
													</h4>
													<pre className="min-h-40 max-h-72 overflow-auto whitespace-pre-wrap break-words leading-7 text-[#777]">
														{text || '—'}
													</pre>
												</div>
											);
										})()}

										{(() => {
											const raw = stringifyLogValue((detailRow as Record<string, unknown>).response);
											return (
												<div className="rounded-xl border border-[#D0D0D0] bg-white p-6">
													<h4 className="mb-6 text-xl font-semibold leading-8 text-[#29292E]">
														{__('Server Response', 'doublescale')}
													</h4>
													<pre className="min-h-40 max-h-72 overflow-auto whitespace-pre-wrap break-words leading-7 text-[#777]">
														{raw || '—'}
													</pre>
												</div>
											);
										})()}
									</div>

									<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
										{(() => {
											const hdr = stringifyLogValue((detailRow as Record<string, unknown>).headers);
											return (
												<div className="rounded-xl border border-[#D0D0D0] bg-white p-6">
													<h4 className="mb-6 text-xl font-semibold leading-8 text-[#29292E]">
														{__('Headers', 'doublescale')}
													</h4>
													<pre className="min-h-32 max-h-64 overflow-auto whitespace-pre-wrap break-words leading-7 text-[#777]">
														{hdr || '—'}
													</pre>
												</div>
											);
										})()}

										{(() => {
											const ctx = stringifyLogValue((detailRow as Record<string, unknown>).context);
											return (
												<div className="rounded-xl border border-[#D0D0D0] bg-white p-6">
													<h4 className="mb-6 text-xl font-semibold leading-8 text-[#29292E]">
														{__('Context', 'doublescale')}
													</h4>
													<pre className="min-h-32 max-h-64 overflow-auto whitespace-pre-wrap break-words leading-7 text-[#777]">
														{ctx || '—'}
													</pre>
												</div>
											);
										})()}
									</div>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
};

export default SmtpEmailLogTable;
