/**
 * Contracts list page with summary cards and charts.
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Eye, MoreVertical, Pencil, Plus, RefreshCw, Tags, Trash2 } from 'lucide-react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

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
import { ConfirmDialog, ContractStatusPill } from '@/components/sales';
import {
	canEditSalesDocument,
	isApprovalWorkflowEnabled,
} from '@/components/sales/sales-approval-utils';
import { deleteContract, useContracts, useContractSummary, useSalesSettings } from '@/hooks/sales';
import { CONTRACT_STATUS_LABELS } from '@/constants/sales';
import type { Contract } from '@/types/sales';

const CHART_COLORS = ['#4c6fff', '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#94a3b8'];

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const contactName = (contract: Contract): string => {
	const c = contract.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

const ContractsList: React.FC = () => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(25);
	const [search, setSearch] = useState('');
	const [showTrash, setShowTrash] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);

	const { data, loading, error, refetch } = useContracts({
		page,
		per_page: perPage,
		search: search || undefined,
		is_trash: showTrash,
		sort_by: 'created_at',
		sort_order: 'desc',
	});
	const { data: salesSettings } = useSalesSettings();

	const { data: summary, refetch: refetchSummary } = useContractSummary();

	const contracts = data?.data ?? [];
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
			await deleteContract(deleteId);
			setDeleteId(null);
			refreshAll();
		} finally {
			setDeleting(false);
		}
	};

	const typeCountData =
		summary?.by_type?.map((row, index) => ({
			name: row.name,
			count: row.count,
			fill: CHART_COLORS[index % CHART_COLORS.length],
		})) ?? [];

	const typeValueData =
		summary?.by_type?.map((row) => ({
			name: row.name,
			value: row.value_total,
		})) ?? [];

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">{__('Contracts', 'doublescale')}</h1>
					<p className="text-sm text-muted-foreground">
						{__('Create and manage customer contracts.', 'doublescale')}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => navigate(getToLink('sales/contract-types'))}
					>
						<Tags className="h-4 w-4 mr-1" />
						{__('Contract Types', 'doublescale')}
					</Button>
					<Button variant="outline" size="icon" onClick={refreshAll}>
						<RefreshCw className="h-4 w-4" />
					</Button>
					<Button onClick={() => navigate(getToLink('sales/contracts/new'))}>
						<Plus className="h-4 w-4 mr-1" />
						{__('New Contract', 'doublescale')}
					</Button>
				</div>
			</div>

			{summary ? (
				<>
					<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
						<div className="border rounded-lg p-4 bg-white">
							<div className="text-xs text-muted-foreground">{__('Active', 'doublescale')}</div>
							<div className="text-2xl font-semibold">{summary.active_count}</div>
						</div>
						<div className="border rounded-lg p-4 bg-white">
							<div className="text-xs text-muted-foreground">{__('Expired', 'doublescale')}</div>
							<div className="text-2xl font-semibold">{summary.expired_count}</div>
						</div>
						<div className="border rounded-lg p-4 bg-white">
							<div className="text-xs text-muted-foreground">
								{__('About to Expire', 'doublescale')}
							</div>
							<div className="text-2xl font-semibold">{summary.about_to_expire_count}</div>
						</div>
						<div className="border rounded-lg p-4 bg-white">
							<div className="text-xs text-muted-foreground">
								{__('Recently Added', 'doublescale')}
							</div>
							<div className="text-2xl font-semibold">{summary.recently_added_count}</div>
						</div>
						<div className="border rounded-lg p-4 bg-white">
							<div className="text-xs text-muted-foreground">{__('Trash', 'doublescale')}</div>
							<div className="text-2xl font-semibold">{summary.trash_count}</div>
						</div>
					</div>

					{summary.by_type.length > 0 ? (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<div className="border rounded-lg p-4 bg-white">
								<h3 className="text-sm font-medium mb-4">
									{__('Contracts by Type', 'doublescale')}
								</h3>
								<div className="h-64">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={typeCountData}
												dataKey="count"
												nameKey="name"
												cx="50%"
												cy="50%"
												outerRadius={90}
												label={({ name, count }) => `${name}: ${count}`}
											>
												{typeCountData.map((entry) => (
													<Cell key={entry.name} fill={entry.fill} />
												))}
											</Pie>
											<Tooltip />
										</PieChart>
									</ResponsiveContainer>
								</div>
							</div>
							<div className="border rounded-lg p-4 bg-white">
								<h3 className="text-sm font-medium mb-4">
									{__('Contracts Value by Type', 'doublescale')}
								</h3>
								<div className="h-64">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={typeValueData} layout="vertical" margin={{ left: 8 }}>
											<CartesianGrid strokeDasharray="3 3" horizontal={false} />
											<XAxis type="number" tickFormatter={(v) => formatMoney(Number(v))} />
											<YAxis type="category" dataKey="name" width={100} />
											<Tooltip formatter={(v: number) => formatMoney(v)} />
											<Bar dataKey="value" fill="#4c6fff" radius={[0, 4, 4, 0]} />
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
						</div>
					) : null}

					<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
						{Object.entries(CONTRACT_STATUS_LABELS).map(([status, label]) => {
							const row = summary.by_status?.[status];
							return (
								<div key={status} className="border rounded-lg p-3 bg-white">
									<div className="text-xs text-muted-foreground mb-1">{label}</div>
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

			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button
					variant={showTrash ? 'default' : 'outline'}
					size="sm"
					onClick={() => {
						setShowTrash((v) => !v);
						setPage(1);
					}}
				>
					{showTrash ? __('Showing Trash', 'doublescale') : __('Show Trash', 'doublescale')}
				</Button>
				<Input
					className="max-w-sm"
					placeholder={__('Search contracts…', 'doublescale')}
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
							<th className="text-left px-4 py-3">{__('Contract #', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Subject', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Customer', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Type', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Value', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Start', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('End', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Status', 'doublescale')}</th>
							<th className="w-12 px-2 py-3" />
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
									{__('Loading…', 'doublescale')}
								</td>
							</tr>
						) : contracts.length === 0 ? (
							<tr>
								<td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
									{__('No contracts found.', 'doublescale')}
								</td>
							</tr>
						) : (
							contracts.map((contract) => (
								<tr
									key={contract.id}
									className="border-b hover:bg-slate-50 cursor-pointer"
									onClick={() => navigate(getToLink(`sales/contracts/${contract.id}`))}
								>
									<td className="px-4 py-3 font-medium">{contract.contract_number}</td>
									<td className="px-4 py-3">{contract.subject}</td>
									<td className="px-4 py-3">{contactName(contract)}</td>
									<td className="px-4 py-3">{contract.contract_type?.name || '—'}</td>
									<td className="px-4 py-3">
										{formatMoney(contract.contract_value, contract.currency)}
									</td>
									<td className="px-4 py-3">{contract.start_date || '—'}</td>
									<td className="px-4 py-3">{contract.end_date || '—'}</td>
									<td className="px-4 py-3">
										<ContractStatusPill
											status={contract.status}
											expired={contract.is_expired}
											aboutToExpire={contract.is_about_to_expire}
										/>
									</td>
									<td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
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
														navigate(getToLink(`sales/contracts/${contract.id}`))
													}
												>
													<Eye className="h-4 w-4" />
													{__('View', 'doublescale')}
												</DropdownMenuItem>
												{canEditSalesDocument(
													isApprovalWorkflowEnabled(salesSettings, contract),
													contract.approval,
													contract
												) ? (
													<DropdownMenuItem
														className="cursor-pointer gap-2"
														onSelect={() =>
															navigate(
																getToLink(`sales/contracts/${contract.id}/edit`)
															)
														}
													>
														<Pencil className="h-4 w-4" />
														{__('Edit', 'doublescale')}
													</DropdownMenuItem>
												) : null}
												<DropdownMenuItem
													className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
													onSelect={() => setDeleteId(contract.id)}
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
				title={__('Delete Contract', 'doublescale')}
				description={__(
					'Are you sure you want to delete this contract? This action cannot be undone.',
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

export default ContractsList;
