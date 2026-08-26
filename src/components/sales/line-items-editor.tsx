/**
 * Line items editor for proposals and invoices (Bit CRM style).
 */

import React, { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import {
	isPercentDiscountType,
	parseDiscountInput,
} from './sales-discount-utils';
import { getCurrencySymbol } from './sales-currency-utils';
import { formatMoney } from '@/constants/currencies';
import { Plus, Trash2 } from 'lucide-react';

import { DeleteIcon, GradientProposalItemsIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { LineItemProductCell } from './line-item-product-cell';
import {
	computeAmount,
	computeLineSubtotal,
	computeLineTotalWithTax,
	getLineItemTaxRate,
	normalizeLineItem,
	syncLineItemTax,
} from './line-item-utils';
import type { LineItem } from '@/types/sales';

/**
 * Context handed to the `doublescale_line_items_product_picker` slot.
 *
 * @deprecated Toolbar pickers are replaced by per-row product cells. Pro still
 * registers row-level search via `doublescale_line_item_product_search`.
 */
export type LineItemPickerPlacement = 'toolbar' | 'empty';

export interface LineItemProductPickerContext {
	onInsert: (item: LineItem) => void;
	disabled: boolean;
	currency: string;
	placement?: LineItemPickerPlacement;
}

const emptyItem = (): LineItem =>
	normalizeLineItem({
		description: '',
		long_description: '',
		qty: 1,
		unit: '',
		rate: 0,
		tax: [],
		discount_percentage: 0,
		tax_rate: 0,
		product_source: 'local',
		optional: false,
	});

export const formatSalesAmount = (value: number, currency = 'USD') =>
	formatMoney(value, currency);

export { computeAmount, computeLineSubtotal, computeLineTotalWithTax };

export const computeLineItemsTotals = (
	items: LineItem[],
	discountType: string,
	discountValue: number,
	adjustment: number
) => {
	let subtotal = 0;
	const lines: { amount: number; taxRates: number[] }[] = [];

	items.forEach((item) => {
		if (item.optional) {
			return;
		}
		const amount = computeAmount(item);
		subtotal += amount;
		lines.push({
			amount,
			taxRates: [getLineItemTaxRate(item)],
		});
	});

	let totalTax = 0;
	let discount = 0;

	if (discountType === 'before_tax' && discountValue > 0) {
		const ratio = discountValue / 100;
		discount = subtotal * ratio;
		lines.forEach((line) => {
			const taxable = line.amount * (1 - ratio);
			line.taxRates.forEach((rate) => {
				totalTax += taxable * (rate / 100);
			});
		});
	} else if (discountType === 'after_tax' && discountValue > 0) {
		lines.forEach((line) => {
			line.taxRates.forEach((rate) => {
				totalTax += line.amount * (rate / 100);
			});
		});
		discount = (subtotal + totalTax) * (discountValue / 100);
	} else {
		lines.forEach((line) => {
			line.taxRates.forEach((rate) => {
				totalTax += line.amount * (rate / 100);
			});
		});
		if (discountValue > 0 && discountType !== 'none') {
			if (discountType === 'fixed') {
				discount = Math.min(subtotal, discountValue);
			} else if (discountType === 'percent') {
				discount = subtotal * (discountValue / 100);
			}
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
	hideDiscountTypeSelect?: boolean;
	readOnly?: boolean;
	emptyStateIcon?: React.ReactNode;
}

const PercentSuffix = () => (
	<Input
		readOnly
		tabIndex={-1}
		value="%"
		className="h-10 w-10 shrink-0 rounded-none border-0 border-l border-[#D0D0D0] bg-[#F7F8FA] px-0 text-center text-sm text-[#6B7280] shadow-none"
	/>
);

const currencyInput = (
	value: number,
	onChange: (value: number) => void,
	currency: string,
	disabled: boolean
) => (
	<div className="flex overflow-hidden rounded-lg border border-[#D0D0D0] bg-white">
		<span className="flex h-10 shrink-0 items-center border-r border-[#D0D0D0] bg-[#F7F8FA] px-2 text-xs font-medium text-[#6B7280]">
			{currency}
		</span>
		<Input
			type="number"
			min={0}
			step="0.01"
			value={value}
			onChange={(e) => onChange(Number(e.target.value))}
			disabled={disabled}
			className="h-10 rounded-none border-0 shadow-none focus-visible:ring-0"
		/>
	</div>
);

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
	emptyStateIcon,
}) => {
	const totals = useMemo(
		() => computeLineItemsTotals(items, discountType, discountValue, adjustment),
		[items, discountType, discountValue, adjustment]
	);

	const activeItems = items.filter((item) => !item.optional);
	const productCount = activeItems.filter((item) => item.description.trim() !== '').length;
	const totalQuantity = activeItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

	const commitItem = (index: number, patch: Partial<LineItem>) => {
		const next = items.map((item, i) => {
			if (i !== index) {
				return item;
			}
			return normalizeLineItem({ ...item, ...patch });
		});
		onChange(next);
	};

	const handleSourceChange = (index: number, source: string) => {
		const item = items[index];
		commitItem(index, {
			product_source: source,
			product_id: undefined,
			description: source === 'custom' ? item.description : '',
			long_description: source === 'custom' ? item.long_description : '',
			rate: source === 'custom' ? item.rate : 0,
			discount_percentage: 0,
			tax_rate: 0,
			tax: [],
		});
	};

	const addItem = () => onChange([...items, emptyItem()]);

	const removeItem = (index: number) => {
		onChange(items.filter((_, i) => i !== index));
	};

	const clearAll = () => onChange([]);

	const showEmptyState = items.length === 0 && !readOnly;

	// Legacy toolbar slot — kept for backward compatibility with extensions.
	applyFilters('doublescale_line_items_product_picker', null, {
		onInsert: (item: LineItem) => onChange([...items, normalizeLineItem(item)]),
		disabled: readOnly,
		currency,
		placement: showEmptyState ? 'empty' : 'toolbar',
	});

	if (showEmptyState) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label className="text-sm !p-0 font-medium text-[#29292E]">
						{__('Items', 'doublescale')}
					</Label>
				</div>
				<div className="flex flex-col items-center justify-center rounded-xl border border-[#D0D0D0] bg-[#F7F8FA] px-6 py-10 text-center">
					{emptyStateIcon ?? <GradientProposalItemsIcon />}
					<p className="mt-3 text-sm font-semibold text-accent-foreground">
						{__('No items yet', 'doublescale')}
					</p>
					<p className="mt-1 max-w-sm text-xs text-[#6B7280]">
						{__(
							'Add a product from your catalog, or start with a custom line.',
							'doublescale'
						)}
					</p>
					<Button
						type="button"
						variant="outline"
						className="mt-6 rounded-lg border-[#262666] bg-white text-[#262666] hover:bg-[#F7F8FA]"
						onClick={addItem}
					>
						<Plus className="mr-1 h-4 w-4" />
						{__('Add line item', 'doublescale')}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label className="text-sm !p-0 font-medium text-[#29292E]">
					{__('Items', 'doublescale')}
				</Label>
				{!readOnly ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="rounded-lg border-[#262666] bg-white text-[#262666] hover:bg-[#F7F8FA]"
						onClick={addItem}
					>
						<Plus className="mr-1 h-4 w-4" />
						{__('Add line item', 'doublescale')}
					</Button>
				) : null}
			</div>

			<div className="overflow-hidden rounded-xl border border-[#DEE1E6]">
				<Table>
					<TableHeader className="bg-[#F8F8F8]">
						<TableRow>
							<TableHead className="min-w-[280px]">
								{__('Product Name', 'doublescale')}
							</TableHead>
							<TableHead className="w-[120px]">{__('Price', 'doublescale')}</TableHead>
							<TableHead className="w-[90px]">{__('Quantity', 'doublescale')}</TableHead>
							<TableHead className="w-[100px]">{__('Discount', 'doublescale')}</TableHead>
							<TableHead className="w-[100px]">{__('Tax Rate', 'doublescale')}</TableHead>
							<TableHead className="w-[120px]">{__('Total', 'doublescale')}</TableHead>
							{!readOnly ? <TableHead className="w-12" /> : null}
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map((item, index) => (
							<TableRow key={`line-item-${index}`}>
								<TableCell className="align-top py-3">
									<LineItemProductCell
										item={item}
										currency={currency}
										disabled={readOnly}
										onChange={(patch) => commitItem(index, patch)}
										onSourceChange={(source) => handleSourceChange(index, source)}
									/>
								</TableCell>
								<TableCell className="align-top py-3">
									{currencyInput(
										item.rate,
										(rate) => commitItem(index, { rate }),
										currency,
										readOnly
									)}
								</TableCell>
								<TableCell className="align-top py-3">
									<Input
										type="number"
										min={0}
										step="0.01"
										value={item.qty}
										onChange={(e) =>
											commitItem(index, { qty: Number(e.target.value) })
										}
										disabled={readOnly}
										className="h-10 rounded-lg border-[#D0D0D0]"
									/>
								</TableCell>
								<TableCell className="align-top py-3">
									<div className="flex overflow-hidden rounded-lg border border-[#D0D0D0] bg-white">
										<Input
											type="number"
											min={0}
											max={100}
											step="0.01"
											value={item.discount_percentage ?? 0}
											onChange={(e) =>
												commitItem(index, {
													discount_percentage: Number(e.target.value),
												})
											}
											disabled={readOnly}
											className="h-10 rounded-none border-0 shadow-none focus-visible:ring-0"
										/>
										<PercentSuffix />
									</div>
								</TableCell>
								<TableCell className="align-top py-3">
									<div className="flex overflow-hidden rounded-lg border border-[#D0D0D0] bg-white">
										<Input
											type="number"
											min={0}
											max={1000}
											step="0.01"
											value={getLineItemTaxRate(item)}
											onChange={(e) =>
												commitItem(
													index,
													syncLineItemTax(item, Number(e.target.value))
												)
											}
											disabled={readOnly}
											className="h-10 rounded-none border-0 shadow-none focus-visible:ring-0"
										/>
										<PercentSuffix />
									</div>
								</TableCell>
								<TableCell className="align-top py-3">
									<div className="flex h-10 items-center text-sm font-semibold text-[#111827]">
										{formatSalesAmount(computeLineTotalWithTax(item), currency)}
									</div>
								</TableCell>
								{!readOnly ? (
									<TableCell className="align-top py-3">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="text-destructive hover:bg-destructive/10 hover:text-destructive"
											onClick={() => removeItem(index)}
											aria-label={__('Remove item', 'doublescale')}
										>
											<DeleteIcon />
										</Button>
									</TableCell>
								) : null}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="flex flex-col gap-4 pt-2 lg:flex-row lg:items-start lg:justify-between">
				{!readOnly ? (
					<Button
						type="button"
						variant="outline"
						className="border-dashed border-red-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
						onClick={clearAll}
					>
						<Trash2 className="mr-2 h-4 w-4" />
						{__('Clear All', 'doublescale')}
					</Button>
				) : (
					<div />
				)}

				<div className="w-full max-w-md space-y-3 lg:text-right">
					<p className="text-xs text-[#6B7280]">
						{sprintf(
							/* translators: 1: product count, 2: total quantity */
							__(
								'Products: %1$s • Total product quantity: %2$s',
								'doublescale'
							),
							productCount,
							totalQuantity
						)}
					</p>

					<div className="space-y-2 rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-4 text-sm">
						{!hideDiscountTypeSelect && onDiscountTypeChange && onDiscountValueChange ? (
							<div className="mb-3 grid grid-cols-2 gap-2 text-left">
								<select
									className="rounded-lg border border-[#D0D0D0] bg-white px-2 py-1.5 text-sm"
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
									/>
								) : (
									<div />
								)}
							</div>
						) : null}

						<div className="flex items-center justify-between gap-6">
							<span className="text-[#6B7280]">{__('Subtotal', 'doublescale')}</span>
							<span className="font-semibold text-[#111827]">
								{formatSalesAmount(totals.subtotal, currency)}
							</span>
						</div>
						<div className="flex items-center justify-between gap-6">
							<span className="text-[#6B7280]">
								{__('Tax (Added)', 'doublescale')}
							</span>
							<span className="font-semibold text-[#111827]">
								{formatSalesAmount(totals.totalTax, currency)}
							</span>
						</div>
						{totals.discount > 0 ? (
							<div className="flex items-center justify-between gap-6">
								<span className="text-[#6B7280]">{__('Discount', 'doublescale')}</span>
								<span className="font-semibold text-[#111827]">
									-{formatSalesAmount(totals.discount, currency)}
								</span>
							</div>
						) : null}
						{onAdjustmentChange ? (
							<div className="space-y-1 border-t border-[#E5E7EB] pt-3 text-left">
								<Label className="text-[#6B7280]">
									{__('Adjustment', 'doublescale')}
								</Label>
								<Input
									type="number"
									step="0.01"
									value={adjustment}
									onChange={(e) => onAdjustmentChange(Number(e.target.value))}
									disabled={readOnly}
									className="bg-white"
								/>
							</div>
						) : null}
						<div className="flex items-center justify-between gap-6 border-t border-[#E5E7EB] pt-3">
							<span className="text-[#6B7280]">{__('Total', 'doublescale')}</span>
							<span className="text-base font-semibold text-[#111827]">
								{formatSalesAmount(totals.total, currency)}
							</span>
						</div>
						<div className="flex items-center justify-end gap-1 text-xs text-[#6B7280]">
							<span>{getCurrencySymbol(currency)}</span>
							<span>{currency}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
