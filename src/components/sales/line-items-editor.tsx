/**
 * Line items editor for proposals and invoices.
 */

import React, { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import {
	isPercentDiscountType,
	parseDiscountInput,
} from './sales-discount-utils';
import { getCurrencySymbol } from './sales-currency-utils';
import { Plus } from 'lucide-react';

import { DeleteIcon, GradientProposalItemsIcon } from '@doublescale/components';
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
import NovicesIcon from '@doublescale/shared/icons/novices';

/**
 * Context handed to the `doublescale_line_items_product_picker` slot.
 *
 * `onInsert` appends only — rows are keyed by array index, so inserting
 * mid-list would remount the rows below and scramble in-progress typing.
 * It also stamps `amount`, keeping that invariant owned in one place.
 */
export interface LineItemProductPickerContext {
	onInsert: (item: LineItem) => void;
	disabled: boolean;
	currency: string;
}

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

export const formatSalesAmount = (value: number, currency = 'USD') => {
	const amount = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
	const suffix =
		currency === 'USD'
			? 'US$'
			: currency === 'EUR'
				? 'EUR'
				: currency === 'GBP'
					? 'GBP'
					: currency;
	return `${amount} ${suffix}`;
};

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
	// Must mirror the backend TotalsCalculator::compute exactly, otherwise the
	// preview shows a different total than what gets saved (the model recomputes
	// on save). before_tax/after_tax change BOTH the tax base and the discount base.
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
			taxRates: (item.tax || []).map((tax) => Number(tax.rate) || 0),
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
	/** When true, discount type is controlled outside (e.g. proposal header). */
	hideDiscountTypeSelect?: boolean;
	readOnly?: boolean;
	emptyStateIcon?: React.ReactNode;
}

const addItemButtonClass =
	'rounded-lg border-[#262666] bg-white text-[#262666] hover:bg-[#F7F8FA]';

interface TotalsSummaryProps {
	totals: ReturnType<typeof computeLineItemsTotals>;
	currency: string;
	discountType: string;
	discountValue: number;
	adjustment: number;
	hideDiscountTypeSelect: boolean;
	readOnly: boolean;
	onDiscountTypeChange?: (value: string) => void;
	onDiscountValueChange?: (value: number) => void;
	onAdjustmentChange?: (value: number) => void;
	showAdjustmentField?: boolean;
}

const TotalsSummary: React.FC<TotalsSummaryProps> = ({
	totals,
	currency,
	discountType,
	discountValue,
	adjustment,
	hideDiscountTypeSelect,
	readOnly,
	onDiscountTypeChange,
	onDiscountValueChange,
	onAdjustmentChange,
	showAdjustmentField = false,
}) => (
	<div className="flex w-full justify-end pt-4">
		<div className="w-full min-w-[240px] max-w-[280px] rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-4">
			<div className="mb-3 flex items-center justify-between">
				<span className="text-xs font-medium text-[#6B7280]">
					{__('Currency', 'doublescale')}
				</span>
				<span className="flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-sm font-medium">
					<span>{getCurrencySymbol(currency)}</span>
					<span className="text-muted-foreground">{currency}</span>
				</span>
			</div>
			{!hideDiscountTypeSelect && onDiscountTypeChange && onDiscountValueChange ? (
				<div className="mb-3 grid grid-cols-2 gap-2">
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
			<div className="space-y-3 text-sm">
				<div className="flex items-center justify-between gap-6">
					<span className="text-[#6B7280]">{__('Sub Total', 'doublescale')}</span>
					<span className="font-semibold text-[#111827]">
						{formatSalesAmount(totals.subtotal, currency)}
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
				<div className="flex items-center justify-between gap-6">
					<span className="text-[#6B7280]">{__('Tax', 'doublescale')}</span>
					<span className="font-semibold text-[#111827]">
						{formatSalesAmount(totals.totalTax, currency)}
					</span>
				</div>
				{onAdjustmentChange && showAdjustmentField ? (
					<div className="space-y-1 border-t border-[#E5E7EB] pt-3">
						<Label className="text-[#6B7280]">{__('Adjustment', 'doublescale')}</Label>
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
			</div>
		</div>
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

	// Append-only, and `amount` is stamped here rather than trusted from the
	// caller: TotalsCalculator prefers a supplied `amount` over qty * rate, so a
	// stale one would silently corrupt the saved total.
	const insertItem = (item: LineItem) =>
		onChange([...items, { ...item, amount: computeAmount(item) }]);

	// Pro fills this slot with the saved-products picker; empty in free.
	const productPickerSlot = applyFilters(
		'doublescale_line_items_product_picker',
		null,
		{ onInsert: insertItem, disabled: readOnly, currency }
	) as React.ReactNode;

	const removeItem = (index: number) => {
		onChange(items.filter((_, i) => i !== index));
	};

	const showEmptyState = items.length === 0 && !readOnly;

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

	const itemsHeader = (
		<div className="flex items-center justify-between">
			<Label className="text-sm !p-0 font-medium text-[#29292E]">
				{__('Items', 'doublescale')}
			</Label>
			{!readOnly ? (
				<div className="flex items-center gap-2">
					{productPickerSlot}
					<Button
						type="button"
						variant="outline"
						size="sm"
						className={addItemButtonClass}
						onClick={addItem}
					>
						<Plus className="mr-1 h-4 w-4" />
						{__('Add custom item', 'doublescale')}
					</Button>
				</div>
			) : null}
		</div>
	);

	const totalsBlock = (
		<TotalsSummary
			totals={totals}
			currency={currency}
			discountType={discountType}
			discountValue={discountValue}
			adjustment={adjustment}
			hideDiscountTypeSelect={hideDiscountTypeSelect}
			readOnly={readOnly}
			onDiscountTypeChange={onDiscountTypeChange}
			onDiscountValueChange={onDiscountValueChange}
			onAdjustmentChange={onAdjustmentChange}
			showAdjustmentField={items.length > 0}
		/>
	);

	if (showEmptyState) {
		return (
			<div className="space-y-4">
				{itemsHeader}
				<div className="flex flex-col items-center justify-center rounded-xl border border-[#D0D0D0] bg-[#F7F8FA] px-6 py-12 text-center">
					{emptyStateIcon ?? <GradientProposalItemsIcon />}
					<p className="mt-4 text-sm font-semibold text-accent-foreground">
						{__(
							'No items found—this space is ready for adding items',
							'doublescale'
						)}
					</p>
					<div className="mt-5 flex items-center justify-center gap-2">
						{productPickerSlot}
						<Button
							type="button"
							variant="outline"
							className={addItemButtonClass}
							onClick={addItem}
						>
							<Plus className="mr-1 h-4 w-4" />
							{__('Add custom item', 'doublescale')}
						</Button>
					</div>
				</div>
				{totalsBlock}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{itemsHeader}

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
							<TableRow key={`line-item-${index}`} className="py-3">
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
										{formatSalesAmount(computeAmount(item), currency)}
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

			{totalsBlock}
		</div>
	);
};
