/**
 * Line items editor for proposals and invoices.
 */

import React, { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	isPercentDiscountType,
	parseDiscountInput,
} from './sales-discount-utils';
import { Plus, Trash2 } from 'lucide-react';

import { DeleteIcon, GradientProposalItemsIcon, PlusIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';
import { Switch } from '@/components/ui/switch';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
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

export const computeAmount = (item: LineItem): number => {
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
	readOnly?: boolean;
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
	readOnly = false,
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

	const addItemButton = !readOnly ? (
		<Button type="button" variant="outline" size="sm" onClick={addItem} className="border-primary text-primary bg-white">
			<Plus className="mr-1 h-4 w-4" />
			{__('Add Item', 'doublescale')}
		</Button>
	) : null;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label className="text-base font-semibold text-foreground pt-0">
					{__('Items', 'doublescale')}
				</Label>
				{items.length > 0 ? addItemButton : null}
			</div>

			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-[#DEE1E6] bg-background px-4 py-16 text-center">
					<div className="mb-5">
						<GradientProposalItemsIcon />
					</div>
					<p className="mb-6 max-w-lg text-xl font-semibold text-accent-foreground">
						{__(
							'No items found—this space is ready for adding items',
							'doublescale'
						)}
					</p>
					{addItemButton ? (
						<Button type="button" variant="outline" onClick={addItem} className="border-primary text-primary bg-white">
							<PlusIcon />
							{__('Add Item', 'doublescale')}
						</Button>
					) : null}
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-[#DEE1E6]">
					<Table>
						<TableHeader className="bg-[#F8F8F8]">
							<TableRow>
								<TableHead className="min-w-[120px]">{__('Item', 'doublescale')}</TableHead>
								<TableHead className="min-w-[140px]">
									{__('Description', 'doublescale')}
								</TableHead>
								<TableHead className="w-20">{__('Qty', 'doublescale')}</TableHead>
								<TableHead className="w-24">{__('Rate', 'doublescale')}</TableHead>
								<TableHead className="w-28">{__('Amount', 'doublescale')}</TableHead>
								<TableHead className="w-24">{__('Unit', 'doublescale')}</TableHead>
								<TableHead className="min-w-[120px]">{__('Tax', 'doublescale')}</TableHead>
								<TableHead className="w-24 text-center">
									{__('Optional', 'doublescale')}
								</TableHead>
								{!readOnly ? (
									<TableHead className="w-16 text-center">
										{__('Actions', 'doublescale')}
									</TableHead>
								) : null}
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item, index) => (
								<TableRow key={`line-item-${index}`} className='py-3'>
									<TableCell className="align-middle">
										<Input
											value={item.description}
											onChange={(e) =>
												updateItem(index, { description: e.target.value })
											}
											placeholder={__('Item', 'doublescale')}
											disabled={readOnly}
										/>
									</TableCell>
									<TableCell className="align-middle">
										<Textarea
											value={item.long_description || ''}
											onChange={(e) =>
												updateItem(index, {
													long_description: e.target.value,
												})
											}
											rows={2}
											disabled={readOnly}
										/>
									</TableCell>
									<TableCell className="align-middle">
										<Input
											type="number"
											min={0}
											step="0.01"
											value={item.qty}
											onChange={(e) =>
												updateItem(index, { qty: Number(e.target.value) })
											}
											disabled={readOnly}
											className="!rounded-lg !border-border"
										/>
									</TableCell>
									<TableCell className="align-middle">
										<Input
											type="number"
											min={0}
											step="0.01"
											value={item.rate}
											onChange={(e) =>
												updateItem(index, { rate: Number(e.target.value) })
											}
											placeholder={__('ex: 1,2,3', 'doublescale')}
											disabled={readOnly}
											className="!rounded-lg !border-border"
										/>
									</TableCell>
									<TableCell className="align-middle">
										<div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
											{formatMoney(computeAmount(item))}
										</div>
									</TableCell>
									<TableCell className="align-middle">
										<Input
											value={item.unit || ''}
											onChange={(e) =>
												updateItem(index, { unit: e.target.value })
											}
											disabled={readOnly}
										/>
									</TableCell>
									<TableCell className="align-middle">
										<MultiSelect
											options={taxOptions}
											selected={selectedTaxOptions(item)}
											onChange={(selected) => handleTaxChange(index, selected)}
											placeholder={__('No Tax', 'doublescale')}
											disabled={readOnly || taxesLoading}
											isLoading={taxesLoading}
											className="h-10"
										/>
									</TableCell>
									<TableCell className="align-middle">
										<div className="flex h-10 items-center justify-center">
											<Switch
												checked={Boolean(item.optional)}
												onCheckedChange={(checked) =>
													updateItem(index, { optional: Boolean(checked) })
												}
												disabled={readOnly}
											/>
										</div>
									</TableCell>
									{!readOnly ? (
										<TableCell className="align-middle">
											<div className="flex h-10 items-center justify-center">
												<Button
													type="button"
													variant="ghost"
													className="text-destructive hover:text-destructive"
													onClick={() => removeItem(index)}
													aria-label={__('Remove item', 'doublescale')}
												>
													<DeleteIcon />
												</Button>
											</div>
										</TableCell>
									) : null}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			<div className="flex justify-end">
				<div className="w-full max-w-sm space-y-4 rounded-xl border border-[#DEE1E6] bg-background p-4">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground font-medium">{__('Sub Total', 'doublescale')}</span>
						<span className="font-semibold">{formatMoney(totals.subtotal)}</span>
					</div>
					{!hideDiscountTypeSelect &&
					onDiscountTypeChange &&
					onDiscountValueChange ? (
						<div className="grid grid-cols-2 gap-2">
							<select
								className="!rounded-lg border !border-border px-2 py-1 text-sm"
								value={discountType}
								onChange={(e) => onDiscountTypeChange(e.target.value)}
								disabled={readOnly}
							>
								<option value="none">{__('No discount', 'doublescale')}</option>
								<option value="percent">{__('Percent', 'doublescale')}</option>
								<option value="fixed">{__('Fixed', 'doublescale')}</option>
							</select>
							{discountType !== 'none' ? (
								<Input
									type="number"
									min={0}
									max={isPercentDiscountType(discountType) ? 100 : undefined}
									step="0.01"
									value={discountValue}
									onChange={(e) =>
										onDiscountValueChange(parseDiscountInput(e.target.value))
									}
									disabled={readOnly}
									placeholder={
										discountType === 'percent'
											? __('%', 'doublescale')
											: __('Amount', 'doublescale')
									}
									className="!rounded-lg !border-border"
								/>
							) : (
								<div />
							)}
						</div>
					) : null}
					{totals.discount > 0 ? (
						<div className="flex justify-between text-sm text-foreground">
							<span className="text-muted-foreground font-medium">{__('Discount', 'doublescale')}</span>
							<span className="font-semibold">- {formatMoney(totals.discount)}</span>
						</div>
					) : null}
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground font-medium">{__('Tax', 'doublescale')}</span>
						<span className="font-semibold">{formatMoney(totals.totalTax)}</span>
					</div>
					{onAdjustmentChange ? (
						<div className="flex items-center justify-between text-sm">
							<Label className="text-muted-foreground font-medium">{__('Adjustment', 'doublescale')}</Label>
							<Input
								type="number"
								step="0.01"
								value={adjustment}
								onChange={(e) =>
									onAdjustmentChange(Number(e.target.value))
								}
								disabled={readOnly}
								className="!rounded-lg !border-border w-24"
							/>
						</div>
					) : null}
					<div className="flex justify-between border-t pt-2 font-semibold">
						<span className="text-muted-foreground font-medium">{__('Total', 'doublescale')}</span>
						<span className="font-semibold">{formatMoney(totals.total)}</span>
					</div>
				</div>
			</div>
		</div>
	);
};
