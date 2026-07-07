/**
 * CRUD UI for sales taxes on the settings page.
 */

import React, { useState } from '@wordpress/element';
import type { FC } from 'react';
import { __ } from '@wordpress/i18n';
import { Plus } from 'lucide-react';

import {
	CustomDialogHeader,
	DeleteIcon,
	EditHeaderIcon,
	EmptyTaxesIcon,
	SettingsTaxesIcon,
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
	createSalesTax,
	deleteSalesTax,
	updateSalesTax,
	useSalesTaxes,
} from '@/hooks/sales';
import type { SalesTax } from '@/types/sales';

interface TaxFormState {
	name: string;
	rate: string;
}

const emptyForm = (): TaxFormState => ({ name: '', rate: '' });

const CreateTaxButton: FC<{ onClick: () => void; className?: string }> = ({
	onClick,
	className,
}) => (
	<Button onClick={onClick} className={className}>
		<Plus className="mr-1 h-4 w-4" />
		{__('Create New Tax', 'doublescale')}
	</Button>
);

const TaxCard: FC<{
	tax: SalesTax;
	onEdit: (tax: SalesTax) => void;
	onDelete: (tax: SalesTax) => void;
}> = ({ tax, onEdit, onDelete }) => (
	<div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
		<div className="flex min-w-0 items-center gap-2">
			<span className="truncate text-sm font-semibold text-foreground">
				{tax.name}
			</span>
			<span className="shrink-0 rounded-lg bg-[#D9E9F3] px-2 py-1 text-sm font-medium text-[#0D9DFC]">
				{tax.rate}%
			</span>
		</div>
		<div className="flex shrink-0 items-center gap-0.5">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="h-8 w-8"
				onClick={() => onEdit(tax)}
				aria-label={__('Edit tax', 'doublescale')}
			>
				<EditHeaderIcon color="#0D9DFC" width={18} height={18} />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="h-8 w-8 text-destructive"
				onClick={() => onDelete(tax)}
				aria-label={__('Delete tax', 'doublescale')}
			>
				<DeleteIcon width={18} height={18} />
			</Button>
		</div>
	</div>
);

export const TaxesManager: FC = () => {
	const { data: taxes, loading, error, refetch } = useSalesTaxes();
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<SalesTax | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<SalesTax | null>(null);
	const [form, setForm] = useState<TaxFormState>(emptyForm);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm());
		setNotice(null);
		setFormOpen(true);
	};

	const openEdit = (tax: SalesTax) => {
		setEditing(tax);
		setForm({ name: tax.name, rate: String(tax.rate) });
		setNotice(null);
		setFormOpen(true);
	};

	const handleSave = async () => {
		const name = form.name.trim();
		const rate = Number(form.rate);
		if (!name) {
			setNotice(__('Tax name is required.', 'doublescale'));
			return;
		}
		if (Number.isNaN(rate) || rate < 0 || rate > 100) {
			setNotice(__('Tax rate must be between 0 and 100.', 'doublescale'));
			return;
		}

		setBusy(true);
		setNotice(null);
		try {
			if (editing) {
				await updateSalesTax(editing.id, { name, rate });
			} else {
				await createSalesTax({ name, rate });
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
			await deleteSalesTax(deleteTarget.id);
			await refetch();
			setDeleteTarget(null);
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('Delete failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	const hasTaxes = taxes.length > 0;

	return (
		<section className="space-y-6 rounded-xl border border-border bg-[#F7F8FA] p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0 space-y-1">
					<div className="flex items-center gap-3">
						<div className="flex p-1.5 shrink-0 items-center justify-center rounded-full bg-white border border-border text-[#0D9DFC]">
							<SettingsTaxesIcon width={20} height={20} />
						</div>
						<h2 className="lg:text-xl text-base font-semibold text-foreground">
							{__('Taxes', 'doublescale')}
						</h2>
					</div>
					<p className="pl-[52px] lg:text-base text-sm text-muted-foreground">
						{__(
							'Manage tax rates available when editing proposal and invoice line items.',
							'doublescale'
						)}
					</p>
				</div>
				<CreateTaxButton onClick={openCreate} />
			</div>

			{notice && !formOpen && !deleteTarget ? (
				<div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700">
					{notice}
				</div>
			) : null}

			{loading ? (
				<p className="text-sm text-muted-foreground">{__('Loading taxes…', 'doublescale')}</p>
			) : error ? (
				<p className="text-sm text-red-600">{error}</p>
			) : !hasTaxes ? (
				<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
					<div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
						<EmptyTaxesIcon width={53} height={53} />
					</div>
					<p className="text-lg font-semibold text-foreground">
						{__('No taxes yet', 'doublescale')}
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						{__('Create a tax to get started', 'doublescale')}
					</p>
					<CreateTaxButton onClick={openCreate} className="mt-6" />
				</div>
			) : (
				<div className="grid grid-cols-1 sm:gap-6 gap-4 sm:grid-cols-2 min-[1200px]:grid-cols-3 xl:grid-cols-4">
					{taxes.map((tax) => (
						<TaxCard
							key={tax.id}
							tax={tax}
							onEdit={openEdit}
							onDelete={setDeleteTarget}
						/>
					))}
				</div>
			)}

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
									? __('Edit Tax', 'doublescale')
									: __('Create New Tax', 'doublescale')
							}
							subtitle={__(
								'Quickly add a new tax with a clear interface that keeps everything organized',
								'doublescale'
							)}
							icon={<EmptyTaxesIcon width={24} height={24} />}
						/>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="tax-name">
								{__('Name', 'doublescale')}
								<span className="text-red-500"> *</span>
							</Label>
							<Input
								id="tax-name"
								value={form.name}
								onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
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
						<div className="space-y-2">
							<Label htmlFor="tax-rate">
								{__('Rate (%)', 'doublescale')}
								<span className="text-red-500"> *</span>
							</Label>
							<Input
								id="tax-rate"
								type="number"
								min={0}
								max={100}
								step="0.01"
								value={form.rate}
								onChange={(e) => setForm((prev) => ({ ...prev, rate: e.target.value }))}
								placeholder={__('Rate (%)', 'doublescale')}
								disabled={busy}
								className="h-10 !rounded-lg !border-border"
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										void handleSave();
									}
								}}
							/>
						</div>
						{notice ? <p className="text-sm text-red-600">{notice}</p> : null}
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
						<Button type="button" onClick={() => void handleSave()} disabled={busy}>
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
				title={__('Delete Tax', 'doublescale')}
				description={__(
					'Are you sure you want to delete this tax? Existing line items are not changed.',
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
