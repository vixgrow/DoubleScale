/**
 * Per-row product source selector + search, Bit CRM style.
 */

import React, { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { LineItem } from '@/types/sales';

export interface LineItemProductSourceOption {
	id: string;
	label: string;
	shortLabel?: string;
	disabled?: boolean;
	inactive?: boolean;
}

export interface LineItemProductSearchContext {
	source: string;
	item: LineItem;
	currency: string;
	disabled: boolean;
	onSelect: (patch: Partial<LineItem>) => void;
}

const DEFAULT_SOURCES: LineItemProductSourceOption[] = [
	{
		id: 'custom',
		label: __('Custom', 'doublescale'),
		shortLabel: __('Custom', 'doublescale'),
	},
];

interface LineItemProductCellProps {
	item: LineItem;
	currency: string;
	disabled: boolean;
	onChange: (patch: Partial<LineItem>) => void;
	onSourceChange: (source: string) => void;
}

const sourceLabel = (source: LineItemProductSourceOption) =>
	source.shortLabel || source.label;

export const LineItemProductCell: React.FC<LineItemProductCellProps> = ({
	item,
	currency,
	disabled,
	onChange,
	onSourceChange,
}) => {
	const sources = applyFilters(
		'doublescale_line_item_product_sources',
		DEFAULT_SOURCES
	) as LineItemProductSourceOption[];

	const activeSource =
		sources.find((source) => source.id === item.product_source) ??
		sources.find((source) => source.id === 'custom') ??
		sources[0];

	const isCustom = activeSource?.id === 'custom';

	const productSearch = applyFilters(
		'doublescale_line_item_product_search',
		null,
		{
			source: activeSource?.id ?? 'custom',
			item,
			currency,
			disabled: disabled || Boolean(activeSource?.disabled),
			onSelect: onChange,
		}
	) as React.ReactNode;

	const sourceOptions = useMemo(
		() =>
			sources.map((source) => ({
				...source,
				display: source.inactive
					? `${source.label} (${__('Inactive', 'doublescale')})`
					: source.label,
			})),
		[sources]
	);

	return (
		<div className="space-y-2">
			<div className="flex gap-0 overflow-hidden rounded-lg border border-[#D0D0D0] bg-white">
				<Select
					value={activeSource?.id ?? 'custom'}
					onValueChange={onSourceChange}
					disabled={disabled}
				>
					<SelectTrigger className="h-10 w-[88px] shrink-0 rounded-none border-0 border-r border-[#D0D0D0] bg-[#F7F8FA] px-2 text-xs font-medium shadow-none focus:ring-0">
						<SelectValue>
							{activeSource ? sourceLabel(activeSource) : __('Source', 'doublescale')}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{sourceOptions.map((source) => (
							<SelectItem
								key={source.id}
								value={source.id}
								disabled={source.disabled}
								className="text-sm"
							>
								<span className="flex items-center gap-2">
									<span>{source.display}</span>
									{source.inactive ? (
										<span className="rounded bg-[#E5E7EB] px-1.5 py-0.5 text-[10px] font-medium text-[#6B7280]">
											{__('Inactive', 'doublescale')}
										</span>
									) : null}
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="min-w-0 flex-1">
					{isCustom ? (
						<Input
							value={item.description}
							onChange={(e) => onChange({ description: e.target.value })}
							placeholder={__('Item name', 'doublescale')}
							disabled={disabled}
							className="h-10 rounded-none border-0 shadow-none focus-visible:ring-0"
						/>
					) : (
						<div className="h-10 [&_button]:h-10 [&_button]:rounded-none [&_button]:border-0 [&_button]:shadow-none">
							{productSearch ?? (
								<Input
									value={item.description}
									onChange={(e) => onChange({ description: e.target.value })}
									placeholder={__('Search and select', 'doublescale')}
									disabled={disabled}
									className="h-10 rounded-none border-0 shadow-none focus-visible:ring-0"
								/>
							)}
						</div>
					)}
				</div>
			</div>

			<Textarea
				value={item.long_description || ''}
				onChange={(e) => onChange({ long_description: e.target.value })}
				placeholder={__('Description', 'doublescale')}
				rows={1}
				disabled={disabled}
				className="min-h-[40px] resize-y rounded-lg border-[#D0D0D0] bg-white text-sm"
			/>
		</div>
	);
};

export default LineItemProductCell;
