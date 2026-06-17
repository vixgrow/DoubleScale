/**
 * Contract types list with search, add, edit, and delete.
 */

import React, { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/sales';
import {
	createContractType,
	deleteContractType,
	updateContractType,
	useContractTypes,
} from '@/hooks/sales';
import type { ContractType } from '@/types/sales';

const MANAGE_CAPS = ['doublescale_manage_all_sales', 'doublescale_crm_manager'];

const ContractTypesPage: React.FC = () => {
	const navigate = useNavigate();
	const { hasRequiredCapability } = useCapabilities();
	const canManage = hasRequiredCapability(MANAGE_CAPS);

	const { data: types, loading, error, refetch } = useContractTypes();
	const [search, setSearch] = useState('');
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<ContractType | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<ContractType | null>(null);
	const [name, setName] = useState('');
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) {
			return types;
		}
		return types.filter((type) => type.name.toLowerCase().includes(query));
	}, [search, types]);

	const openCreate = () => {
		setEditing(null);
		setName('');
		setNotice(null);
		setFormOpen(true);
	};

	const openEdit = (type: ContractType) => {
		setEditing(type);
		setName(type.name);
		setNotice(null);
		setFormOpen(true);
	};

	const handleSave = async () => {
		const trimmed = name.trim();
		if (!trimmed) {
			setNotice(__('Contract type name is required.', 'doublescale'));
			return;
		}

		setBusy(true);
		setNotice(null);
		try {
			if (editing) {
				await updateContractType(editing.id, { name: trimmed });
			} else {
				await createContractType({ name: trimmed });
			}
			await refetch();
			setFormOpen(false);
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('Save failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await deleteContractType(deleteTarget.id);
			await refetch();
			setDeleteTarget(null);
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('Delete failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="p-6 space-y-6 max-w-4xl">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">{__('Contract Types', 'doublescale')}</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{__(
							'Organize contracts by type (e.g. Service Agreement, NDA, Retainer).',
							'doublescale'
						)}
					</p>
				</div>
				<Button variant="outline" onClick={() => navigate(getToLink('sales/contracts'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Back to Contracts', 'doublescale')}
				</Button>
			</div>

			<div className="flex flex-col sm:flex-row sm:items-center gap-3">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={__('Search contract types…', 'doublescale')}
						className="pl-9"
					/>
				</div>
				{canManage ? (
					<Button onClick={openCreate}>
						<Plus className="h-4 w-4 mr-1" />
						{__('Add Type', 'doublescale')}
					</Button>
				) : null}
			</div>

			{notice && !formOpen ? (
				<div className="text-sm rounded border px-3 py-2 bg-slate-50 text-slate-700">{notice}</div>
			) : null}

			<section className="border rounded-lg bg-white overflow-hidden">
				{loading ? (
					<p className="p-6 text-sm text-muted-foreground">
						{__('Loading contract types…', 'doublescale')}
					</p>
				) : error ? (
					<p className="p-6 text-sm text-red-600">{error}</p>
				) : filtered.length === 0 ? (
					<p className="p-6 text-sm text-muted-foreground">
						{search.trim()
							? __('No contract types match your search.', 'doublescale')
							: __('No contract types yet.', 'doublescale')}
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/30 text-left text-muted-foreground">
									<th className="px-4 py-3 font-medium">{__('Name', 'doublescale')}</th>
									{canManage ? (
										<th className="px-4 py-3 font-medium text-right">
											{__('Actions', 'doublescale')}
										</th>
									) : null}
								</tr>
							</thead>
							<tbody>
								{filtered.map((type) => (
									<tr key={type.id} className="border-b last:border-0">
										<td className="px-4 py-3 font-medium">{type.name}</td>
										{canManage ? (
											<td className="px-4 py-3 text-right">
												<div className="flex justify-end gap-1">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => openEdit(type)}
														aria-label={__('Edit contract type', 'doublescale')}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setDeleteTarget(type)}
														aria-label={__('Delete contract type', 'doublescale')}
													>
														<Trash2 className="h-4 w-4 text-red-600" />
													</Button>
												</div>
											</td>
										) : null}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{!canManage ? (
				<p className="text-xs text-muted-foreground">
					{__(
						'You can view contract types. Contact a sales manager to add or edit types.',
						'doublescale'
					)}
				</p>
			) : null}

			<Dialog open={formOpen} onOpenChange={setFormOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editing
								? __('Edit Contract Type', 'doublescale')
								: __('Add Contract Type', 'doublescale')}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="contract-type-name">{__('Name', 'doublescale')}</Label>
							<Input
								id="contract-type-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={__('e.g. Service Agreement', 'doublescale')}
								disabled={busy}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										void handleSave();
									}
								}}
							/>
						</div>
						{notice ? <div className="text-sm text-red-600">{notice}</div> : null}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setFormOpen(false)} disabled={busy}>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button onClick={() => void handleSave()} disabled={busy}>
							{busy ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTarget(null);
					}
				}}
				title={__('Delete Contract Type', 'doublescale')}
				description={__(
					'Are you sure you want to delete this contract type? Types in use by contracts cannot be deleted.',
					'doublescale'
				)}
				confirmLabel={__('Delete', 'doublescale')}
				destructive
				busy={busy}
				onConfirm={handleDelete}
			/>
		</div>
	);
};

export default ContractTypesPage;
