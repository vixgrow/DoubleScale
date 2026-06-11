/**
 * Line items editor for proposals and invoices.
 */

import React, { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';
import { useSalesTaxes } from '@/hooks/sales';
import type { LineItem, LineItemTax, SalesTax } from '@/types/sales';

const emptyItem = (): LineItem => ({
	description: '',
	long_description: '',
	qty: 1,
	unit: '',
	rate: 0,
	tax: [],
	amount: 0,
	optional: false,
});

const computeAmount = (item: LineItem): number => {
	const qty = Number(item.qty) || 0;
	const rate = Number(item.rate) || 0;
	return Math.round(qty * rate * 100) / 100;
};

const taxLabel = (tax: SalesTax | LineItemTax): string =>
	`${Number(tax.rate).toFixed(2)}% ${tax.name}`;

export const computeLineItemsTotals = (
	items: LineItem[],
	discountType: string,
	discountValue: number,
	adjustment: number
) => {
	let subtotal = 0;
	let totalTax = 0;

	items.forEach((item) => {
		if (item.optional) {
			return;
		}
		const amount = computeAmount(item);
		subtotal += amount;
		(item.tax || []).forEach((tax) => {
			totalTax += amount * ((Number(tax.rate) || 0) / 100);
		});
	});

	let discount = 0;
	if (discountValue > 0 && discountType !== 'none') {
		if (discountType === 'fixed') {
			discount = Math.min(subtotal, discountValue);
		} else {
			discount = subtotal * (discountValue / 100);
		}
	}

	const total = Math.max(0, subtotal + totalTax - discount + (Number(adjustment) || 0));

	return {
		subtotal: Math.round(subtotal * 100) / 100,
		totalTax: Math.round(totalTax * 100) / 100,
		discount: Math.round(discount * 100) / 100,
		total: Math.round(total * 100) / 100,
	};
};

interface LineItemsEditorProps {
	items: LineItem[];
	onChange: (items: LineItem[]) => void;
	currency?: string;
	discountType?: string;
	discountValue?: number;
	adjustment?: number;
	onDiscountTypeChange?: (value: string) => void;
	onDiscountValueChange?: (value: number) => void;
	onAdjustmentChange?: (value: number) => void;
	/** When true, discount type is controlled outside (e.g. proposal header). */
	hideDiscountTypeSelect?: boolean;
}

export const LineItemsEditor: React.FC<LineItemsEditorProps> = ({
	items,
	onChange,
	currency = 'USD',
	discountType = 'none',
	discountValue = 0,
	adjustment = 0,
	onDiscountTypeChange,
	onDiscountValueChange,
	onAdjustmentChange,
	hideDiscountTypeSelect = false,
}) => {
	const { data: salesTaxes, loading: taxesLoading } = useSalesTaxes();

	const taxOptions = useMemo(
		() =>
			salesTaxes.map((tax) => ({
				label: taxLabel(tax),
				value: String(tax.id),
			})),
		[salesTaxes]
	);

	const taxById = useMemo(() => {
		const map = new Map<string, SalesTax>();
		salesTaxes.forEach((tax) => map.set(String(tax.id), tax));
		return map;
	}, [salesTaxes]);

	const totals = useMemo(
		() => computeLineItemsTotals(items, discountType, discountValue, adjustment),
		[items, discountType, discountValue, adjustment]
	);

	const updateItem = (index: number, patch: Partial<LineItem>) => {
		const next = items.map((item, i) => {
			if (i !== index) {
				return item;
			}
			const merged = { ...item, ...patch };
			return { ...merged, amount: computeAmount(merged) };
		});
		onChange(next);
	};

	const addItem = () => onChange([...items, emptyItem()]);

	const removeItem = (index: number) => {
		onChange(items.filter((_, i) => i !== index));
	};

	const formatMoney = (value: number) =>
		new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency,
		}).format(value);

	const selectedTaxOptions = (item: LineItem) =>
		(item.tax || [])
			.map((tax) => {
				const id = tax.id != null ? String(tax.id) : '';
				const match = id ? taxById.get(id) : salesTaxes.find((t) => t.name === tax.name);
				if (!match) {
					return {
						label: taxLabel(tax),
						value: id || tax.name,
					};
				}
				return {
					label: taxLabel(match),
					value: String(match.id),
				};
			})
			.filter((option, index, list) => list.findIndex((o) => o.value === option.value) === index);

	const handleTaxChange = (index: number, selected: { label: string; value: string }[]) => {
		const taxes: LineItemTax[] = selected
			.map((option) => taxById.get(option.value))
			.filter((tax): tax is SalesTax => Boolean(tax))
			.map((tax) => ({
				id: tax.id,
				name: tax.name,
				rate: tax.rate,
			}));
		updateItem(index, { tax: taxes });
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>{__('Items', 'doublescale')}</Label>
				<Button type="button" variant="outline" size="sm" onClick={addItem}>
					<Plus className="h-4 w-4 mr-1" />
					{__('Add Item', 'doublescale')}
				</Button>
			</div>

			<div className="space-y-3">
				{items.map((item, index) => (
					<div
						key={`line-item-${index}`}
						className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border rounded-lg bg-white"
					>
						<div className="md:col-span-2 space-y-2">
							<Label>{__('Item', 'doublescale')}</Label>
							<Input
								value={item.description}
								onChange={(e) =>
									updateItem(index, { description: e.target.value })
								}
								placeholder={__('Item name', 'doublescale')}
							/>
						</div>
						<div className="md:col-span-2 space-y-2">
							<Label>{__('Description', 'doublescale')}</Label>
							<Textarea
								value={item.long_description || ''}
								onChange={(e) =>
									updateItem(index, { long_description: e.target.value })
								}
								rows={2}
							/>
						</div>
						<div className="md:col-span-2 space-y-2">
							<Label>{__('Qty', 'doublescale')}</Label>
							<Input
								type="number"
								min={0}
								step="0.01"
								value={item.qty}
								onChange={(e) =>
									updateItem(index, { qty: Number(e.target.value) })
								}
							/>
							<Input
								value={item.unit || ''}
								onChange={(e) => updateItem(index, { unit: e.target.value })}
								placeholder={__('Unit', 'doublescale')}
							/>
						</div>
						<div className="md:col-span-2 space-y-2">
							<Label>{__('Rate', 'doublescale')}</Label>
							<Input
								type="number"
								min={0}
								step="0.01"
								value={item.rate}
								onChange={(e) =>
									updateItem(index, { rate: Number(e.target.value) })
								}
							/>
							<div className="text-sm text-muted-foreground pt-1">
								{__('Amount', 'doublescale')}: {formatMoney(computeAmount(item))}
							</div>
						</div>
						<div className="md:col-span-2 space-y-2">
							<Label>{__('Tax', 'doublescale')}</Label>
							<MultiSelect
								options={taxOptions}
								selected={selectedTaxOptions(item)}
								onChange={(selected) => handleTaxChange(index, selected)}
								placeholder={__('No Tax', 'doublescale')}
								disabled={taxesLoading}
								isLoading={taxesLoading}
								className="h-10"
							/>
						</div>
						<div className="md:col-span-2 flex flex-col justify-between gap-2">
							<div className="flex items-center gap-2">
								<Checkbox
									checked={Boolean(item.optional)}
									onCheckedChange={(checked) =>
										updateItem(index, { optional: Boolean(checked) })
									}
								/>
								<Label>{__('Optional', 'doublescale')}</Label>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => removeItem(index)}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				))}
			</div>

			<div className="flex justify-end">
				<div className="w-full max-w-sm space-y-2 border rounded-lg p-4 bg-slate-50">
					<div className="flex justify-between text-sm">
						<span>{__('Sub Total', 'doublescale')}</span>
						<span className="font-medium">{formatMoney(totals.subtotal)}</span>
					</div>
					{!hideDiscountTypeSelect &&
					onDiscountTypeChange &&
					onDiscountValueChange ? (
						<div className="grid grid-cols-2 gap-2">
							<select
								className="border rounded px-2 py-1 text-sm"
								value={discountType}
								onChange={(e) => onDiscountTypeChange(e.target.value)}
							>
								<option value="none">{__('No discount', 'doublescale')}</option>
								<option value="percent">{__('Percent', 'doublescale')}</option>
								<option value="fixed">{__('Fixed', 'doublescale')}</option>
							</select>
							{discountType !== 'none' ? (
								<Input
									type="number"
									min={0}
									step="0.01"
									value={discountValue}
									onChange={(e) =>
										onDiscountValueChange(Number(e.target.value))
									}
									placeholder={
										discountType === 'percent'
											? __('%', 'doublescale')
											: __('Amount', 'doublescale')
									}
								/>
							) : (
								<div />
							)}
						</div>
					) : null}
					{totals.discount > 0 ? (
						<div className="flex justify-between text-sm text-muted-foreground">
							<span>{__('Discount', 'doublescale')}</span>
							<span>-{formatMoney(totals.discount)}</span>
						</div>
					) : null}
					<div className="flex justify-between text-sm">
						<span>{__('Tax', 'doublescale')}</span>
						<span className="font-medium">{formatMoney(totals.totalTax)}</span>
					</div>
					{onAdjustmentChange ? (
						<div className="space-y-1">
							<Label>{__('Adjustment', 'doublescale')}</Label>
							<Input
								type="number"
								step="0.01"
								value={adjustment}
								onChange={(e) =>
									onAdjustmentChange(Number(e.target.value))
								}
							/>
						</div>
					) : null}
					<div className="flex justify-between font-semibold border-t pt-2">
						<span>{__('Total', 'doublescale')}</span>
						<span>{formatMoney(totals.total)}</span>
					</div>
				</div>
			</div>
		</div>
	);
};
