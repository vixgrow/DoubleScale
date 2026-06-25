/**
 * Proposals list page.
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
import { ConfirmDialog, ProposalStatusPill } from '@/components/sales';
import {
	canEditSalesDocument,
	isApprovalWorkflowEnabled,
} from '@/components/sales/sales-approval-utils';
import { deleteProposal, useProposals, useSalesSettings } from '@/hooks/sales';
import type { Proposal } from '@/types/sales';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const contactName = (proposal: Proposal): string => {
	if (proposal.to_name) {
		return proposal.to_name;
	}
	const c = proposal.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

const ProposalsList: React.FC = () => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(25);
	const [search, setSearch] = useState('');
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);

	const { data, loading, error, refetch } = useProposals({
		page,
		per_page: perPage,
		search: search || undefined,
		sort_by: 'created_at',
		sort_order: 'desc',
	});
	const { data: salesSettings } = useSalesSettings();

	const proposals = data?.data ?? [];
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
			await deleteProposal(deleteId);
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
					<h1 className="text-2xl font-semibold">{__('Proposals', 'doublescale')}</h1>
					<p className="text-sm text-muted-foreground">
						{__('Create and manage customer proposals.', 'doublescale')}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="icon" onClick={() => void refetch()}>
						<RefreshCw className="h-4 w-4" />
					</Button>
					<Button onClick={() => navigate(getToLink('sales/proposals/new'))}>
						<Plus className="h-4 w-4 mr-1" />
						{__('New Proposal', 'doublescale')}
					</Button>
				</div>
			</div>

			<div className="flex justify-end">
				<Input
					className="max-w-sm"
					placeholder={__('Search proposals…', 'doublescale')}
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
				/>
			</div>

			{error ? (
				<div className="text-sm text-red-600">{error}</div>
			) : null}

			<div className="border rounded-lg overflow-hidden bg-white">
				<table className="w-full text-sm">
					<thead className="bg-slate-50 border-b">
						<tr>
							<th className="text-left px-4 py-3">{__('Proposal #', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Subject', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('To', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Total', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Date', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Open Till', 'doublescale')}</th>
							<th className="text-left px-4 py-3">{__('Status', 'doublescale')}</th>
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
						) : proposals.length === 0 ? (
							<tr>
								<td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
									{__('No proposals found.', 'doublescale')}
								</td>
							</tr>
						) : (
							proposals.map((proposal) => (
								<tr
									key={proposal.id}
									className="border-b hover:bg-slate-50 cursor-pointer"
									onClick={() =>
										navigate(getToLink(`sales/proposals/${proposal.id}`))
									}
								>
									<td className="px-4 py-3 font-medium">{proposal.proposal_number}</td>
									<td className="px-4 py-3">{proposal.subject}</td>
									<td className="px-4 py-3">{contactName(proposal)}</td>
									<td className="px-4 py-3">
										{formatMoney(proposal.total, proposal.currency)}
									</td>
									<td className="px-4 py-3">{proposal.date || '—'}</td>
									<td className="px-4 py-3">{proposal.open_till || '—'}</td>
									<td className="px-4 py-3">
										<ProposalStatusPill
											status={proposal.status}
											expired={proposal.is_expired}
										/>
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
															getToLink(`sales/proposals/${proposal.id}`)
														)
													}
												>
													<Eye className="h-4 w-4" />
													{__('View', 'doublescale')}
												</DropdownMenuItem>
												{canEditSalesDocument(
													isApprovalWorkflowEnabled(salesSettings, proposal),
													proposal.approval,
													proposal
												) ? (
													<DropdownMenuItem
														className="cursor-pointer gap-2"
														onSelect={() =>
															navigate(
																getToLink(
																	`sales/proposals/${proposal.id}/edit`
																)
															)
														}
													>
														<Pencil className="h-4 w-4" />
														{__('Edit', 'doublescale')}
													</DropdownMenuItem>
												) : null}
												<DropdownMenuItem
													className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
													onSelect={() => setDeleteId(proposal.id)}
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
				title={__('Delete Proposal', 'doublescale')}
				description={__(
					'Are you sure you want to delete this proposal? This action cannot be undone.',
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

export default ProposalsList;
