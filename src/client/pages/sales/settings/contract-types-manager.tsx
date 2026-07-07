/**
 * Contract types list with search, add, edit, and delete.
 */

import React, { useMemo, useState } from '@wordpress/element';
import type { FC } from 'react';
import { __ } from '@wordpress/i18n';
import { Plus, Search } from 'lucide-react';

import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import {
	ContractTypesIcon,
	CustomDialogHeader,
	DeleteIcon,
	EditHeaderIcon,
	EmptyContractTypesIcon,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
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

const CreateTypeButton: FC<{ onClick: () => void; className?: string }> = ({
	onClick,
	className,
}) => (
	<Button onClick={onClick} className={className}>
		<Plus className="mr-1 h-4 w-4" />
		{__('Create New Type', 'doublescale')}
	</Button>
);

const ContractTypeCard: FC<{
	type: ContractType;
	canManage: boolean;
	onEdit: (type: ContractType) => void;
	onDelete: (type: ContractType) => void;
}> = ({ type, canManage, onEdit, onDelete }) => (
	<div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
		<span className="min-w-0 truncate text-sm font-semibold text-foreground">
			{type.name}
		</span>
		{canManage ? (
			<div className="flex shrink-0 items-center gap-0.5">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => onEdit(type)}
					aria-label={__('Edit contract type', 'doublescale')}
				>
					<EditHeaderIcon color="#0D9DFC" width={18} height={18} />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-destructive"
					onClick={() => onDelete(type)}
					aria-label={__('Delete contract type', 'doublescale')}
				>
					<DeleteIcon width={18} height={18} />
				</Button>
			</div>
		) : null}
	</div>
);

export const ContractTypesManager: FC = () => {
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

	const hasTypes = types.length > 0;
	const isSearchEmpty = search.trim().length > 0 && filtered.length === 0;

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
		<section className="space-y-6 rounded-xl border border-border bg-[#F7F8FA] p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0 space-y-1">
					<div className="flex items-center gap-3">
						<div className="flex p-1.5 shrink-0 items-center justify-center rounded-full bg-white border border-border text-[#0D9DFC]">
							<ContractTypesIcon width={20} height={22} />
						</div>
						<h2 className="text-base lg:text-xl font-semibold text-foreground">
							{__('Contract Types', 'doublescale')}
						</h2>
					</div>
					<p className="pl-[52px] lg:text-base text-sm text-muted-foreground">
						{__(
							'Organize contracts by type (e.g. Service Agreement, NDA, Retainer).',
							'doublescale'
						)}
					</p>
				</div>
				{canManage ? <CreateTypeButton onClick={openCreate} /> : null}
			</div>

			{hasTypes ? (
				<div className="relative">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={__('Search contract types…', 'doublescale')}
						className="h-10 rounded-lg border-[#D0D0D0] pl-9"
					/>
				</div>
			) : null}

			{notice && !formOpen && !deleteTarget ? (
				<div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700">
					{notice}
				</div>
			) : null}

			{loading ? (
				<p className="text-sm text-muted-foreground">
					{__('Loading contract types…', 'doublescale')}
				</p>
			) : error ? (
				<p className="text-sm text-red-600">{error}</p>
			) : !hasTypes ? (
				<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
					<div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
						<EmptyContractTypesIcon width={46} height={53} />
					</div>
					<p className="text-lg font-semibold text-foreground">
						{__('No contract types yet', 'doublescale')}
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						{__(
							'Create a contract type to get started',
							'doublescale'
						)}
					</p>
					{canManage ? (
						<CreateTypeButton
							onClick={openCreate}
							className="mt-6"
						/>
					) : null}
				</div>
			) : isSearchEmpty ? (
				<p className="py-8 text-center text-sm text-muted-foreground">
					{__('No contract types match your search.', 'doublescale')}
				</p>
			) : (
				<div className="grid grid-cols-1 sm:gap-6 gap-4 sm:grid-cols-2 min-[1200px]:grid-cols-3 xl:grid-cols-4">
					{filtered.map((type) => (
						<ContractTypeCard
							key={type.id}
							type={type}
							canManage={canManage}
							onEdit={openEdit}
							onDelete={setDeleteTarget}
						/>
					))}
				</div>
			)}

			{!canManage ? (
				<p className="text-xs text-muted-foreground">
					{__(
						'You can view contract types. Contact a sales manager to add or edit types.',
						'doublescale'
					)}
				</p>
			) : null}

			<Dialog
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) {
						setNotice(null);
					}
				}}
			>
				<DialogContent className="max-w-md gap-0 bg-white sm:rounded-xl">
					<DialogHeader className="space-y-4 pb-4">
						<CustomDialogHeader
							title={
								editing
									? __('Edit Contract Type', 'doublescale')
									: __('Create New Type', 'doublescale')
							}
							subtitle={__(
								'Quickly add a new type with a clear interface that keeps everything organized',
								'doublescale'
							)}
							icon={<EmptyContractTypesIcon width={21} height={24} />}
						/>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="contract-type-name">
								{__('Name', 'doublescale')}
								<span className="text-red-500"> *</span>
							</Label>
							<Input
								id="contract-type-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={__('Name', 'doublescale')}
								disabled={busy}
								className="h-10 rounded-lg border-[#D0D0D0]"
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										void handleSave();
									}
								}}
							/>
						</div>
						{notice ? (
							<p className="text-sm text-red-600">{notice}</p>
						) : null}
					</div>

					<DialogFooter className="mt-6 flex gap-3 sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => setFormOpen(false)}
							disabled={busy}
							className="border-primary bg-white text-primary"
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							type="button"
							onClick={() => void handleSave()}
							disabled={busy}
						>
							{busy
								? __('Saving…', 'doublescale')
								: editing
									? __('Save', 'doublescale')
									: __('Create', 'doublescale')}
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
		</section>
	);
};
