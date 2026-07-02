/**
 * Invoices list page with summary cards.
 */

import React, { useState } from '@wordpress/element';
import type { ComponentType } from 'react';
import { __ } from '@wordpress/i18n';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from '@/components/ui/select';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { ConfirmDialog, InvoiceFormDialog, InvoiceStatusPill } from '@/components/sales';
import {
	canEditSalesDocument,
	isApprovalWorkflowEnabled,
} from '@/components/sales/sales-approval-utils';
import { deleteInvoice, useInvoices, useInvoiceSummary, useSalesSettings } from '@/hooks/sales';
import { INVOICE_STATUS_LABELS, INVOICE_STATUSES, type InvoiceStatus } from '@/constants/sales';
import type { Invoice } from '@/types/sales';
import {
	DashboardContentCard,
	DeleteIcon,
	DraftIcon,
	EditHeaderIcon,
	MessageStatsCard,
	NoData,
	NovicesIcon,
	OutstandingInvoicesIcon,
	PageHeader,
	PainInvoicesIcon,
	PartiallyPaidIcon,
	PastInvoicesIcon,
	ShowIcon,
	UnpaidIcon,
	ViewIcon,
} from '@doublescale/components';
import type { IconProps } from '@doublescale/config';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const formatTableAmount = (value: number, currency = 'USD') => {
	const amount = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
	const suffix =
		currency === 'USD' ? 'US$' : currency === 'EUR' ? 'EUR' : currency === 'GBP' ? 'GBP' : currency;
	return `${amount} ${suffix}`;
};

const toDateString = (date: Date | null | undefined): string => {
	if (!date) {
		return '';
	}
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
};

const parseDateString = (value: string): Date | null => {
	if (!value) {
		return null;
	}
	const [y, m, d] = value.split('-').map(Number);
	if (!y || !m || !d) {
		return null;
	}
	return new Date(y, m - 1, d);
};

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

const statusSummaryConfig: Record<
	InvoiceStatus,
	{
		Icon: ComponentType<IconProps>;
		iconBgClass: string;
		percentageBadgeClass: string;
	}
> = {
	unpaid: {
		Icon: UnpaidIcon,
		iconBgClass: 'bg-[#CB5301]',
		percentageBadgeClass: 'bg-[#FAEADF] text-[#CB5301]',
	},
	paid: {
		Icon: PainInvoicesIcon,
		iconBgClass: 'bg-[#16A34A]',
		percentageBadgeClass: 'bg-[#E4FAEC] text-[#16A34A]',
	},
	partially_paid: {
		Icon: PartiallyPaidIcon,
		iconBgClass: 'bg-[#FFD242]',
		percentageBadgeClass: 'bg-[#F7F4C3] text-[#896900]',
	},
	overdue: {
		Icon: PastInvoicesIcon,
		iconBgClass: 'bg-[#C30A0A]',
		percentageBadgeClass: 'bg-[#FBE8E8] text-[#C30A0A]',
	},
	draft: {
		Icon: DraftIcon,
		iconBgClass: 'bg-[#6B6C76]',
		percentageBadgeClass: 'bg-[#ECECEC] text-[#6B6C76]',
	},
};

const InvoicesList: React.FC = () => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(25);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [invoiceDateFrom, setInvoiceDateFrom] = useState('');
	const [invoiceDateTo, setInvoiceDateTo] = useState('');
	const [dueDateFrom, setDueDateFrom] = useState('');
	const [dueDateTo, setDueDateTo] = useState('');
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const { data, loading, error, refetch } = useInvoices({
		page,
		per_page: perPage,
		search: search || undefined,
		status: statusFilter || undefined,
		invoice_date_from: invoiceDateFrom || undefined,
		invoice_date_to: invoiceDateTo || undefined,
		due_date_from: dueDateFrom || undefined,
		due_date_to: dueDateTo || undefined,
		sort_by: 'created_at',
		sort_order: 'desc',
	});

	const { data: summary, refetch: refetchSummary } = useInvoiceSummary();
	const { data: salesSettings } = useSalesSettings();

	const invoices = data?.data ?? [];
	const total = data?.meta?.total ?? 0;
	const hasFilters = Boolean(
		search ||
			statusFilter ||
			invoiceDateFrom ||
			invoiceDateTo ||
			dueDateFrom ||
			dueDateTo
	);
	const showEmptyState = !loading && total === 0 && !hasFilters;

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
		<div className="space-y-6">

			<PageHeader title={__('Invoices', 'doublescale')}
			actions={[
				{
					label: __('Create New Invoice', 'doublescale'),
					onClick: () => setCreateDialogOpen(true),
					icon: <Plus className="h-4 w-4 mr-1" />,
				}
			]}
			rowClassName="flex-row items-center justify-between w-full [&_h1]:min-w-0"
			className="flex-row shrink-0 flex-wrap items-center justify-end gap-3 sm:gap-6"
			/>

			{summary ? (
				<DashboardContentCard
				title={__('Analytics Overview', 'doublescale')}
				cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]"
				contentClassName="flex min-h-0 flex-1 flex-col"
			>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ">

						<MessageStatsCard
						label={__('Paid Invoices', 'doublescale')}
						layout="centered"
						value={formatMoney(summary.paid_total)}
						icon={<PainInvoicesIcon width={29} height={29} />}
						iconBgClass="bg-[#16A34A]"
						className="bg-[#F7F8FA]"
						iconColor="text-white"
						/>
						<MessageStatsCard
						label={__('Past Invoices', 'doublescale')}
						layout="centered"
						value={formatMoney(summary.past_total)}
						icon={<PastInvoicesIcon width={29} height={29} />}
						iconBgClass="bg-[#C30A0A]"
						className="bg-[#F7F8FA]"
						iconColor="text-white"
						/>
						<MessageStatsCard
						label={__('Outstanding Invoices', 'doublescale')}
						layout="centered"
						value={formatMoney(summary.outstanding_total)}
						icon={<OutstandingInvoicesIcon width={29} height={29} />}
						iconBgClass="bg-[#262666]"
						className="bg-[#F7F8FA]"
						iconColor="text-white"
						/>

					</div>

					<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
						{summaryCards.map((status) => {
							const row = summary.by_status?.[status];
							const { Icon, iconBgClass, percentageBadgeClass } =
								statusSummaryConfig[status];
							return (
								<MessageStatsCard
									key={status}
									label={INVOICE_STATUS_LABELS[status]}
									layout="centered-badge"
									value={`${row?.count ?? 0} / ${summary.total_count}`}
									percentage={row?.percent ?? 0}
									icon={<Icon width={29} height={29} />}
									iconBgClass={iconBgClass}
									percentageBadgeClass={percentageBadgeClass}
									className="bg-[#F7F8FA]"
									iconColor="text-white"
								/>
							);
						})}
					</div>
				</DashboardContentCard>
			) : null}

			<div className="overflow-hidden p-6 rounded-[20px] bg-white shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
				<div className="flex flex-col gap-3  sm:flex-row sm:items-center sm:justify-between">
					<div className="relative min-w-0 flex-1 md:max-w-xl">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6C76]" />
						<Input
							className="h-9 rounded-lg border-[#D0D0D0] pl-9 text-sm"
							placeholder={__('Search invoices…', 'doublescale')}
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{/* <DateRangePicker
							value={{
								from: parseDateString(invoiceDateFrom),
								to: parseDateString(invoiceDateTo),
							}}
							onChange={(range) => {
								setInvoiceDateFrom(toDateString(range.from));
								setInvoiceDateTo(toDateString(range.to));
								setPage(1);
							}}
							placeholder={__('Date', 'doublescale')}
							className="h-9 w-[8.5rem] max-w-[8.5rem] shrink-0 rounded-lg border-[#D0D0D0] bg-white px-2 lg:w-[8.5rem] xl:w-[8.5rem]"
						/>
						<DateRangePicker
							value={{
								from: parseDateString(dueDateFrom),
								to: parseDateString(dueDateTo),
							}}
							onChange={(range) => {
								setDueDateFrom(toDateString(range.from));
								setDueDateTo(toDateString(range.to));
								setPage(1);
							}}
							placeholder={__('Due Date', 'doublescale')}
							className="h-9 w-[8.5rem] max-w-[8.5rem] shrink-0 rounded-lg border-[#D0D0D0] bg-white px-2 lg:w-[8.5rem] xl:w-[8.5rem]"
						/> */}
						<Select
							value={statusFilter || 'all'}
							onValueChange={(value) => {
								setStatusFilter(value === 'all' ? '' : value);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-10 w-[130px] rounded-lg border-[#D0D0D0] bg-white px-4 text-sm font-normal text-[#29292E]">
								{statusFilter
									? INVOICE_STATUS_LABELS[statusFilter as InvoiceStatus]
									: __('Status', 'doublescale')}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{__('All Statuses', 'doublescale')}</SelectItem>
								{INVOICE_STATUSES.map((status) => (
									<SelectItem key={status} value={status}>
										{INVOICE_STATUS_LABELS[status]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{error ? (
					<div className="px-6 pt-4 text-sm text-red-600">{error}</div>
				) : null}

				{loading ? (
					<div className="px-6 py-16 text-center text-sm text-muted-foreground">
						{__('Loading…', 'doublescale')}
					</div>
				) : showEmptyState ? (
					<NoData
						icon={<NovicesIcon />}
						title={__('No invoices yet', 'doublescale')}
						subtitle={__(
							'Create a new invoice to get started',
							'doublescale'
						)}
						buttonLabel={__('Create New Invoice', 'doublescale')}

						onClick={() => setCreateDialogOpen(true)}

					/>
				) : (
					<>
						<div className="overflow-x-auto rounded-[10px] border border-border bg-white mt-6">
							<table className="w-full text-sm">
								<thead className="border-b border-border bg-[#F8F8F8]">
									<tr className="text-left text-[#6B6C76]">
										<th className="px-6 py-3 font-medium">
											{__('Invoice #', 'doublescale')}
										</th>
										<th className="px-4 py-3 font-medium">
											{__('Customer', 'doublescale')}
										</th>
										<th className="px-4 py-3 font-medium">
											{__('Amount', 'doublescale')}
										</th>
										<th className="px-4 py-3 font-medium">
											{__('Status', 'doublescale')}
										</th>
										<th className="px-4 py-3 font-medium">
											{__('Date', 'doublescale')}
										</th>
										<th className="px-4 py-3 font-medium">
											{__('Due Date', 'doublescale')}
										</th>
										<th className="px-6 py-3 font-medium text-right">
											{__('Actions', 'doublescale')}
										</th>
									</tr>
								</thead>
								<tbody>
									{invoices.length === 0 ? (
										<tr>
											<td
												colSpan={7}
												className="px-6 py-16 text-center text-muted-foreground"
											>
												{__('No invoices found.', 'doublescale')}
											</td>
										</tr>
									) : (
										invoices.map((invoice) => {
											const canEdit = canEditSalesDocument(
												isApprovalWorkflowEnabled(salesSettings, invoice),
												invoice.approval,
												invoice
											);

											return (
												<tr
													key={invoice.id}
													className=" border-b border-border odd:bg-white even:bg-[#FAFAFA] last:!border-b-0 hover:bg-[#F3F4F6]"
												>
													<td className="px-6 py-4 font-medium text-[#29292E]">
														{invoice.invoice_number}
													</td>
													<td className="px-4 py-4 text-[#29292E]">
														{contactName(invoice)}
													</td>
													<td className="px-4 py-4 text-[#29292E]">
														{formatTableAmount(
															invoice.total,
															invoice.currency
														)}
													</td>
													<td className="px-4 py-4">
														<InvoiceStatusPill status={invoice.status} />
													</td>
													<td className="px-4 py-4 text-[#29292E]">
														{invoice.invoice_date || '—'}
													</td>
													<td className="px-4 py-4 text-[#29292E]">
														{invoice.due_date || '—'}
													</td>
													<td className="px-6 py-4">
														<div className="flex items-center justify-end gap-1">
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-[#3A3A99] hover:bg-blue-50 hover:text-[#3A3A99]"
																aria-label={__('View', 'doublescale')}
																onClick={() =>
																	navigate(
																		getToLink(
																			`sales/invoices/${invoice.id}`
																		)
																	)
																}
															>
																<ShowIcon width={24} height={24} color="#3A3A99" />
															</Button>
															{canEdit ? (
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8 text-[#0D9DFC] hover:bg-blue-50 hover:text-[#0D9DFC]"
																	aria-label={__('Edit', 'doublescale')}
																	onClick={() =>
																		navigate(
																			getToLink(
																				`sales/invoices/${invoice.id}/edit`
																			)
																		)
																	}
																>
																	<EditHeaderIcon width={24} height={24} color="#0D9DFC" />
																</Button>
															) : null}
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-[#DC2626] hover:bg-red-50 hover:text-[#DC2626]"
																aria-label={__('Delete', 'doublescale')}
																onClick={() => setDeleteId(invoice.id)}
															>
																<DeleteIcon width={24} height={24} />
															</Button>
														</div>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>

						{invoices.length > 0 ? (
							<div className="border-t border-[#ECECEC] px-4 py-4">
								<DataTablePagination table={table} totalRecords={total} />
							</div>
						) : null}
					</>
				)}
			</div>

			<InvoiceFormDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
				onSaved={() => refreshAll()}
			/>

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
