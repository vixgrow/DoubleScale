/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Card,
	CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { fetchSmtpEmailLogs } from '../settings/smtp/smtp-api';
import SmtpEmailLogTable, {
	type SmtpLogFilter,
} from '../settings/smtp/smtp-email-log-table';
import type { EmailLogRow } from '../settings/smtp/types';

type SmtpEmailLogPanelProps = {
	refreshRef?: { current: (() => Promise<void>) | null };
	deleteSelectedRef?: { current: (() => void) | null };
	onLogLoadingChange?: (loading: boolean) => void;
	onSelectedCountChange?: (count: number) => void;
	onBulkDeletingChange?: (busy: boolean) => void;
};

function formatLocalYmd(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function useDebouncedValue<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = window.setTimeout(() => setDebounced(value), delay);
		return () => window.clearTimeout(t);
	}, [value, delay]);
	return debounced;
}

const SmtpEmailLogPanel: React.FC<SmtpEmailLogPanelProps> = ({
	refreshRef,
	deleteSelectedRef,
	onLogLoadingChange,
	onSelectedCountChange,
	onBulkDeletingChange,
}) => {
	const [logLoading, setLogLoading] = useState(false);
	const [logs, setLogs] = useState<EmailLogRow[]>([]);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [deleteSelectedAction, setDeleteSelectedAction] = useState<
		(() => void) | null
	>(null);

	const [activeFilter, setActiveFilter] = useState<SmtpLogFilter>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebouncedValue(searchQuery, 350);
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
	});

	const dateRangeKey = useMemo(() => {
		if (dateRange.from && dateRange.to) {
			return `${formatLocalYmd(dateRange.from)}_${formatLocalYmd(dateRange.to)}`;
		}
		return '';
	}, [dateRange.from, dateRange.to]);

	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords: totalItems,
		setPage,
		setPerPage,
	});

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, dateRangeKey]);

	const loadLogs = useCallback(async () => {
		setLogLoading(true);
		setError(null);
		try {
			const params: Parameters<typeof fetchSmtpEmailLogs>[0] = {
				page,
				per_page: perPage,
			};
			if (activeFilter !== 'all') {
				params.status = activeFilter;
			}
			const q = debouncedSearch.trim();
			if (q) {
				params.search = q;
			}
			if (dateRange.from && dateRange.to) {
				params.start_date = formatLocalYmd(dateRange.from);
				params.end_date = formatLocalYmd(dateRange.to);
			}
			const res = await fetchSmtpEmailLogs(params);
			const nextTotalItems = res.total_items ?? 0;
			const nextTotalPages = Math.max(
				1,
				res.total_pages ??
					(perPage > 0 ? Math.ceil(nextTotalItems / perPage) : 1)
			);

			if (page > nextTotalPages) {
				setPage(nextTotalPages);
				return;
			}

			setTotalItems(nextTotalItems);
			setLogs((res.items || []) as EmailLogRow[]);
		} catch (e: unknown) {
			setError(
				e instanceof Error
					? e.message
					: __('Could not load email log.', 'doublescale')
			);
		} finally {
			setLogLoading(false);
		}
	}, [activeFilter, dateRangeKey, debouncedSearch, page, perPage]);

	useEffect(() => {
		void loadLogs();
	}, [loadLogs]);

	useEffect(() => {
		if (!refreshRef) return;
		refreshRef.current = loadLogs;
		return () => {
			refreshRef.current = null;
		};
	}, [loadLogs, refreshRef]);

	useEffect(() => {
		if (!deleteSelectedRef) return;
		deleteSelectedRef.current = deleteSelectedAction;
		return () => {
			deleteSelectedRef.current = null;
		};
	}, [deleteSelectedAction, deleteSelectedRef]);

	useEffect(() => {
		onLogLoadingChange?.(logLoading);
	}, [logLoading, onLogLoadingChange]);

	return (
		<div className="space-y-4">
			{error && (
				<Alert variant="destructive">
					<AlertTitle>{__('Error', 'doublescale')}</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<Card>
				<CardContent>
					<SmtpEmailLogTable
						logs={logs}
						logLoading={logLoading}
						controlledFilters={{
							activeFilter,
							onActiveFilterChange: (next) => {
								setPage(1);
								setActiveFilter(next);
							},
							searchQuery,
							onSearchQueryChange: setSearchQuery,
							dateRange,
							onDateRangeChange: (next) => {
								setPage(1);
								setDateRange(next);
							},
						}}
						onLogsMutated={() => void loadLogs()}
						onActionError={(msg) => setError(msg)}
						onSelectedCountChange={onSelectedCountChange}
						onBulkDeletingChange={onBulkDeletingChange}
						onDeleteSelectedActionChange={setDeleteSelectedAction}
					/>
					{totalItems > 0 && (
						<DataTablePagination table={serverSideTable} />
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default SmtpEmailLogPanel;
