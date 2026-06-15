/**
 * CRUD table for sales taxes on the settings page.
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Pencil, Plus, Trash2 } from 'lucide-react';

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

export const TaxesManager: React.FC = () => {
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
		setFormOpen(true);
	};

	const openEdit = (tax: SalesTax) => {
		setEditing(tax);
		setForm({ name: tax.name, rate: String(tax.rate) });
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
		setNotice(null);
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

	return (
		<section className="space-y-4 border rounded-lg bg-white p-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="font-medium">{__('Taxes', 'doublescale')}</h2>
					<p className="text-sm text-muted-foreground mt-1">
						{__(
							'Manage tax rates available when editing proposal and invoice line items.',
							'doublescale'
						)}
					</p>
				</div>
				<Button variant="outline" size="sm" onClick={openCreate}>
					<Plus className="h-4 w-4 mr-1" />
					{__('Add Tax', 'doublescale')}
				</Button>
			</div>

			{notice ? (
				<div className="text-sm rounded border px-3 py-2 bg-slate-50 text-slate-700">{notice}</div>
			) : null}

			{loading ? (
				<p className="text-sm text-muted-foreground">{__('Loading taxes…', 'doublescale')}</p>
			) : error ? (
				<p className="text-sm text-red-600">{error}</p>
			) : taxes.length === 0 ? (
				<p className="text-sm text-muted-foreground">{__('No taxes configured yet.', 'doublescale')}</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b text-left text-muted-foreground">
								<th className="py-2 pr-4 font-medium">{__('Name', 'doublescale')}</th>
								<th className="py-2 pr-4 font-medium">{__('Rate (%)', 'doublescale')}</th>
								<th className="py-2 font-medium text-right">{__('Actions', 'doublescale')}</th>
							</tr>
						</thead>
						<tbody>
							{taxes.map((tax) => (
								<tr key={tax.id} className="border-b last:border-0">
									<td className="py-3 pr-4">{tax.name}</td>
									<td className="py-3 pr-4">{tax.rate}</td>
									<td className="py-3 text-right">
										<div className="flex justify-end gap-2">
											<Button variant="ghost" size="sm" onClick={() => openEdit(tax)}>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setDeleteTarget(tax)}
											>
												<Trash2 className="h-4 w-4 text-red-600" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<Dialog open={formOpen} onOpenChange={setFormOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editing ? __('Edit Tax', 'doublescale') : __('Add Tax', 'doublescale')}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="tax-name">{__('Name', 'doublescale')}</Label>
							<Input
								id="tax-name"
								value={form.name}
								onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
								disabled={busy}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="tax-rate">{__('Rate (%)', 'doublescale')}</Label>
							<Input
								id="tax-rate"
								type="number"
								min={0}
								max={100}
								step="0.01"
								value={form.rate}
								onChange={(e) => setForm((prev) => ({ ...prev, rate: e.target.value }))}
								disabled={busy}
							/>
						</div>
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
