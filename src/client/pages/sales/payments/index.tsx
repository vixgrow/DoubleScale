/**
 * Payments list page (a global table of all recorded payments).
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Eye, MoreVertical, RefreshCw, Trash2 } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { ConfirmDialog, isSalesRepOnly } from '@/components/sales';
import { deletePayment, usePayments } from '@/hooks/sales';
import { PAYMENT_MODE_LABELS } from '@/constants/sales';
import type { PaymentListItem } from '@/types/sales';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const modeLabel = (mode: string | null): string => {
	if (!mode) {
		return '—';
	}
	return PAYMENT_MODE_LABELS[mode as keyof typeof PAYMENT_MODE_LABELS] ?? mode;
};

const contactName = (payment: PaymentListItem): string => {
	const c = payment.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

const PaymentsList: React.FC = () => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(25);
	const [search, setSearch] = useState('');
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);
	const paymentReadOnly = isSalesRepOnly();

	const { data, loading, error, refetch } = usePayments({
		page,
		per_page: perPage,
		search: search || undefined,
		sort_by: 'id',
		sort_order: 'desc',
	});

	const payments = data?.data ?? [];
	const total = data?.meta?.total ?? 0;

	const table = useServerSideTable({
		page,
		perPage,
		totalRecords: total,
		setPage,
		setPerPage,
	});

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
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">{__('Payments', 'doublescale')}</h1>
					<p className="text-sm text-muted-foreground">
						{__('View all invoice payments across customers.', 'doublescale')}
					</p>
				</div>
				<Button variant="outline" size="icon" onClick={() => void refetch()}>
					<RefreshCw className="h-4 w-4" />
				</Button>
			</div>

			<div className="flex justify-end">
				<Input
					className="max-w-sm"
					placeholder={__('Search payments…', 'doublescale')}
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
				/>
			</div>

			{error ? <div className="text-sm text-red-600">{error}</div> : null}

			<div className="border rounded-lg overflow-hidden bg-white">
				<table className="w-full text-sm">
					<thead className="bg-slate-50 border-b">
						<tr>
							<th className="text-left px-4 py-3">{__('Payment #', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Invoice #', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Payment Mode', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Transaction ID', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Customer', 'doublescale')}</th>
							<th className="text-right px-4 py-3">{__('Amount', 'doublescale')}</th>
							<th className="text-right px-4 py-3">{__('Date', 'doublescale')}</th>
							<th className="w-12 px-2 py-3" />
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
									{__('Loading…', 'doublescale')}
								</td>
							</tr>
						) : payments.length === 0 ? (
							<tr>
								<td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
									{__('No payments found.', 'doublescale')}
								</td>
							</tr>
						) : (
							payments.map((payment) => (
								<tr
									key={payment.id}
									className="border-b hover:bg-slate-50 cursor-pointer"
									onClick={() =>
										navigate(getToLink(`sales/payments/${payment.id}`))
									}
								>
									<td className="px-4 py-3">{payment.id}</td>
									<td className="px-4 py-3">
										{payment.invoice?.invoice_number || `#${payment.invoice_id}`}
									</td>
									<td className="px-4 py-3">{modeLabel(payment.payment_mode)}</td>
									<td className="px-4 py-3">{payment.transaction_id || '—'}</td>
									<td
										className="px-4 py-3"
										onClick={(e) => e.stopPropagation()}
									>
										{payment.contact?.id ? (
											<Button
												variant="link"
												className="h-auto p-0 font-normal text-primary"
												onClick={() =>
													navigate(
														getToLink(`contacts/${payment.contact!.id}`)
													)
												}
											>
												{contactName(payment)}
											</Button>
										) : (
											contactName(payment)
										)}
									</td>
									<td className="px-4 py-3 text-right">
										{formatMoney(
											payment.amount,
											payment.invoice?.currency || 'USD'
										)}
									</td>
									<td className="px-4 py-3 text-right">
										{payment.payment_date || '—'}
									</td>
									<td
										className="px-2 py-3"
										onClick={(e) => e.stopPropagation()}
									>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													aria-label={__('Actions', 'doublescale')}
												>
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="min-w-[10rem]">
												<DropdownMenuItem
													className="cursor-pointer gap-2"
													onSelect={() =>
														navigate(
															getToLink(`sales/payments/${payment.id}`)
														)
													}
												>
													<Eye className="h-4 w-4" />
													{__('View', 'doublescale')}
												</DropdownMenuItem>
												{!paymentReadOnly ? (
													<DropdownMenuItem
														className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
														onSelect={() => setDeleteId(payment.id)}
													>
														<Trash2 className="h-4 w-4" />
														{__('Delete', 'doublescale')}
													</DropdownMenuItem>
												) : null}
											</DropdownMenuContent>
										</DropdownMenu>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<DataTablePagination table={table} />

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
