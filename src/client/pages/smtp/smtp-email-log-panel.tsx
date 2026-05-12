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

	const loadLogs = useCallback(async () => {
		setLogLoading(true);
		setError(null);
		try {
			const params: Parameters<typeof fetchSmtpEmailLogs>[0] = {
				page: 1,
				per_page: 100,
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
	}, [activeFilter, dateRangeKey, debouncedSearch]);

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
							onActiveFilterChange: setActiveFilter,
							searchQuery,
							onSearchQueryChange: setSearchQuery,
							dateRange,
							onDateRangeChange: setDateRange,
						}}
						onLogsMutated={() => void loadLogs()}
						onActionError={(msg) => setError(msg)}
						onSelectedCountChange={onSelectedCountChange}
						onBulkDeletingChange={onBulkDeletingChange}
						onDeleteSelectedActionChange={setDeleteSelectedAction}
					/>
				</CardContent>
			</Card>
		</div>
	);
};

export default SmtpEmailLogPanel;
