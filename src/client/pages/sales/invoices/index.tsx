/**
 * Invoices list page with summary cards.
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Eye, MoreVertical, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';

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
import { ConfirmDialog, InvoiceStatusPill } from '@/components/sales';
import { deleteInvoice, useInvoices, useInvoiceSummary } from '@/hooks/sales';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/constants/sales';
import type { Invoice } from '@/types/sales';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const contactName = (invoice: Invoice): string => {
	const c = invoice.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

const summaryCards: InvoiceStatus[] = [
	'unpaid',
	'paid',
	'partially_paid',
	'overdue',
	'draft',
];

const InvoicesList: React.FC = () => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(25);
	const [search, setSearch] = useState('');
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);

	const { data, loading, error, refetch } = useInvoices({
		page,
		per_page: perPage,
		search: search || undefined,
		sort_by: 'created_at',
		sort_order: 'desc',
	});

	const { data: summary, refetch: refetchSummary } = useInvoiceSummary();

	const invoices = data?.data ?? [];
	const total = data?.meta?.total ?? 0;

	const table = useServerSideTable({
		page,
		perPage,
		totalRecords: total,
		setPage,
		setPerPage,
	});

	const refreshAll = () => {
		void refetch();
		void refetchSummary();
	};

	const confirmDelete = async () => {
		if (!deleteId) {
			return;
		}
		setDeleting(true);
		try {
			await deleteInvoice(deleteId);
			setDeleteId(null);
			refreshAll();
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">{__('Invoices', 'doublescale')}</h1>
					<p className="text-sm text-muted-foreground">
						{__('Track billing, payments, and outstanding amounts.', 'doublescale')}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="icon" onClick={refreshAll}>
						<RefreshCw className="h-4 w-4" />
					</Button>
					<Button onClick={() => navigate(getToLink('sales/invoices/new'))}>
						<Plus className="h-4 w-4 mr-1" />
						{__('Create New Invoice', 'doublescale')}
					</Button>
				</div>
			</div>

			{summary ? (
				<>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="border rounded-lg p-4 bg-white">
							<div className="text-sm text-muted-foreground">{__('Paid Invoices', 'doublescale')}</div>
							<div className="text-2xl font-semibold">{formatMoney(summary.paid_total)}</div>
						</div>
						<div className="border rounded-lg p-4 bg-white">
							<div className="text-sm text-muted-foreground">{__('Past Due Invoices', 'doublescale')}</div>
							<div className="text-2xl font-semibold">{formatMoney(summary.overdue_total)}</div>
						</div>
						<div className="border rounded-lg p-4 bg-white">
							<div className="text-sm text-muted-foreground">{__('Outstanding Invoices', 'doublescale')}</div>
							<div className="text-2xl font-semibold">{formatMoney(summary.outstanding_total)}</div>
						</div>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
						{summaryCards.map((status) => {
							const row = summary.by_status?.[status];
							return (
								<div key={status} className="border rounded-lg p-3 bg-white">
									<div className="text-xs text-muted-foreground mb-1">
										{INVOICE_STATUS_LABELS[status]}
									</div>
									<div className="text-lg font-semibold">
										{row?.count ?? 0} / {summary.total_count}
									</div>
									<div className="text-xs text-muted-foreground">
										{(row?.percent ?? 0).toFixed(2)}%
									</div>
								</div>
							);
						})}
					</div>
				</>
			) : null}

			<div className="flex justify-end">
				<Input
					className="max-w-sm"
					placeholder={__('Search invoices…', 'doublescale')}
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
							<th className="text-left px-4 py-3">{__('Invoice #', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Amount', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Date', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Customer', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Due Date', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Status', 'doublescale')}</th>
							<th className="w-12 px-2 py-3" />
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
									{__('Loading…', 'doublescale')}
								</td>
							</tr>
						) : invoices.length === 0 ? (
							<tr>
								<td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
									{__('No invoices found.', 'doublescale')}
								</td>
							</tr>
						) : (
							invoices.map((invoice) => (
								<tr
									key={invoice.id}
									className="border-b hover:bg-slate-50 cursor-pointer"
									onClick={() =>
										navigate(getToLink(`sales/invoices/${invoice.id}`))
									}
								>
									<td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
									<td className="px-4 py-3">
										{formatMoney(invoice.total, invoice.currency)}
									</td>
									<td className="px-4 py-3">{invoice.invoice_date || '—'}</td>
									<td className="px-4 py-3">{contactName(invoice)}</td>
									<td className="px-4 py-3">{invoice.due_date || '—'}</td>
									<td className="px-4 py-3">
										<InvoiceStatusPill status={invoice.status} />
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
															getToLink(`sales/invoices/${invoice.id}`)
														)
													}
												>
													<Eye className="h-4 w-4" />
													{__('View', 'doublescale')}
												</DropdownMenuItem>
												<DropdownMenuItem
													className="cursor-pointer gap-2"
													onSelect={() =>
														navigate(
															getToLink(
																`sales/invoices/${invoice.id}/edit`
															)
														)
													}
												>
													<Pencil className="h-4 w-4" />
													{__('Edit', 'doublescale')}
												</DropdownMenuItem>
												<DropdownMenuItem
													className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
													onSelect={() => setDeleteId(invoice.id)}
												>
													<Trash2 className="h-4 w-4" />
													{__('Delete', 'doublescale')}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<DataTablePagination table={table} totalRecords={total} />

			<ConfirmDialog
				open={deleteId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteId(null);
					}
				}}
				title={__('Delete Invoice', 'doublescale')}
				description={__(
					'Are you sure you want to delete this invoice? This action cannot be undone.',
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

export default InvoicesList;
