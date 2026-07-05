/**
 * Payments list page (a global table of all recorded payments).
 */

import React, { useEffect, useMemo, useState } from '@wordpress/element';
import type { DataTableConfig } from '@doublescale/client';
import { __ } from '@wordpress/i18n';

import { useNavigate } from '@doublescale/navigation';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { formatDateForAPI } from '@doublescale/utils';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { ConfirmDialog, isSalesRepOnly } from '@/components/sales';
import { deletePayment, usePayments } from '@/hooks/sales';
import {
	PAYMENT_MODE_LABELS,
	PAYMENT_MODES,
} from '@/constants/sales';
import type { PaymentListItem } from '@/types/sales';
import { EmptyPaymentsIcon, PageHeader } from '@doublescale/components';
import { getPaymentColumns } from './columns';

const PAYMENT_MODE_FILTER_OPTIONS = [
	...PAYMENT_MODES,
	'credit_note',
	'credit_card',
] as const;

const PaymentsList: React.FC = () => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [search, setSearch] = useState('');
	const [paymentMode, setPaymentMode] = useState('all');
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({ from: null, to: null });
	const [hasRecords, setHasRecords] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);
	const paymentReadOnly = isSalesRepOnly();

	const { data, loading, error, refetch } = usePayments({
		page,
		per_page: perPage,
		search: search || undefined,
		payment_mode: paymentMode !== 'all' ? paymentMode : undefined,
		payment_date_from: formatDateForAPI(dateRange.from),
		payment_date_to: formatDateForAPI(dateRange.to),
		sort_by: 'id',
		sort_order: 'desc',
	});

	const payments = data?.data ?? [];
	const total = data?.meta?.total ?? 0;

	useEffect(() => {
		if (!loading) {
			setHasRecords((data?.total_count ?? 0) > 0);
		}
	}, [loading, data?.total_count]);

	const table = useServerSideTable({
		page,
		perPage,
		totalRecords: total,
		setPage,
		setPerPage,
	});

	const columns = useMemo(
		() =>
			getPaymentColumns({
				navigate,
				onDelete: setDeleteId,
				paymentReadOnly,
			}),
		[navigate, paymentReadOnly]
	);

	const tableConfig: DataTableConfig<PaymentListItem> = useMemo(
		() => ({
			manageColumns: { enabled: false },
			search: {
				placeholder: __('Search payments...', 'doublescale'),
				onChange: (value) => {
					setSearch(value);
					setPage(1);
				},
				value: search,
			},
			dateRange: {
				enabled: true,
				value: dateRange,
				onDateChange: (range) => {
					setDateRange(range);
					setPage(1);
				},
				placeholder: __('Date', 'doublescale'),
			},
			selectFilters: [
				{
					id: 'payment_mode',
					placeholder: __('Payment Mode', 'doublescale'),
					value: paymentMode,
					onChange: (value) => {
						setPaymentMode(value);
						setPage(1);
					},
					options: [
						{ value: 'all', label: __('All modes', 'doublescale') },
						...PAYMENT_MODE_FILTER_OPTIONS.map((mode) => ({
							value: mode,
							label:
								PAYMENT_MODE_LABELS[
									mode as keyof typeof PAYMENT_MODE_LABELS
								] ?? mode,
						})),
					],
				},
			],
		}),
		[dateRange, paymentMode, search]
	);

	const confirmDelete = async () => {
		if (!deleteId) {
			return;
		}
		setDeleting(true);
		try {
			await deletePayment(deleteId);
			setDeleteId(null);
			await refetch();
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title={__('Payments', 'doublescale')}
				rowClassName="flex-row items-center justify-between w-full [&_h1]:min-w-0"
				className="flex-row shrink-0 flex-wrap items-center justify-end gap-3 sm:gap-6"
			/>

			<div className="overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
				{error ? <div className="mb-4 text-sm text-red-600">{error}</div> : null}

				{loading && !hasRecords ? (
					<div className="py-20 text-center text-sm text-muted-foreground">
						{__('Loading…', 'doublescale')}
					</div>
				) : loading || hasRecords ? (
					<>
						<DataTable
							columns={columns}
							data={payments}
							config={tableConfig}
							showPagination={false}
							initialPageSize={perPage}
							setPage={setPage}
							loading={loading}
						/>
						<DataTablePagination table={table} />
					</>
				) : (
					<div className="flex flex-col items-center justify-center px-4 py-20">
						<div className="flex max-w-sm flex-col items-center text-center">
							<div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
								<EmptyPaymentsIcon width={53} height={53} />
							</div>
							<p className="text-xl font-semibold leading-relaxed text-muted-foreground">
								{__(
									'No payments have been added by users yet',
									'doublescale'
								)}
							</p>
						</div>
					</div>
				)}
			</div>

			<ConfirmDialog
				open={deleteId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteId(null);
					}
				}}
				title={__('Delete Payment', 'doublescale')}
				description={__(
					'Are you sure you want to delete this payment? The invoice status will be updated.',
					'doublescale'
				)}
				confirmLabel={__('Delete', 'doublescale')}
				destructive
				busy={deleting}
				onConfirm={confirmDelete}
			/>
		</div>
	);
};

export default PaymentsList;
