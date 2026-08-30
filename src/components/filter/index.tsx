/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { map, isEmpty, isArray } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	Filter as FilterType,
	FilterSettings,
	ReactSelectOptions,
	Response,
} from '@doublescale/client';
import { DeleteIcon } from '@doublescale/components';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import WithinDaysInput from '../within-days-input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';

interface FilterProps {
	filterSettings: FilterSettings;
	filter: FilterType;
	onChange: (key: string, value: any, extra?: Record<string, any>) => void;
	onRemove: () => void;
}

type OptionsResponse = Response & {
	data: { [key: string]: string }[];
};

const Filter: React.FC<FilterProps> = ({
	filterSettings,
	filter,
	onChange,
	onRemove,
}) => {
	const [options, setOptions] = useState<ReactSelectOptions>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [keyword, setKeyword] = useState<string>('');

	const datePickerClassName =
		'rounded-md border border-input px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm bg-background';
	const showValueInput = !['is_empty', 'is_not_empty'].includes(
		filter.operator
	);
	const fetchOptions = useCallback(async () => {
		if (!filterSettings.is_dynamic) return;

		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs(filterSettings.dynamic_args.endpoint, {
					keyword,
					ids: isArray(filter.value) ? filter.value : '',
				}),
				method: 'GET',
			})) as OptionsResponse;

			setOptions(
				map(response.data, (item: { [key: string]: string }) => ({
					label: item[filterSettings.dynamic_args.label],
					value: item[filterSettings.dynamic_args.key],
				}))
			);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, [
		filterSettings.is_dynamic,
		filterSettings.dynamic_args,
		keyword,
		filter.value,
	]);

	useEffect(() => {
		fetchOptions();
	}, [fetchOptions]);

	return (
		<div className="doublescale-filter">
			<div className="doublescale-filter-row">
				<div className="w-[15%] text-muted-foreground font-medium">
					{filterSettings.name}
				</div>
				<div className="w-[85%] flex items-center gap-3">
					{filterSettings.operators && (
						<Select
							value={filter.operator}
							onValueChange={(value) => {
								const togglingWithin =
									(filter.operator === 'within') !==
									(value === 'within');
								onChange(
									'operator',
									value,
									togglingWithin ? { value: '' } : undefined
								);
							}}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{map(
									filterSettings.operators,
									(label, value) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
					)}
					{showValueInput && filterSettings.type === 'text' && (
						<Input
							value={filter.value}
							onChange={(e) => onChange('value', e.target.value)}
						/>
					)}
					{showValueInput && filterSettings.type === 'number' && (
						<Input
							type="number"
							value={filter.value}
							onChange={(e) => onChange('value', e.target.value)}
						/>
					)}
					{showValueInput && filterSettings.type === 'select' &&
						!filterSettings.is_dynamic && (
							<Select
								value={filter.value}
								onValueChange={(value) =>
									onChange('value', value)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{map(
										filterSettings.options,
										(label, value) => (
											<SelectItem
												key={value}
												value={value}
											>
												{label}
											</SelectItem>
										)
									)}
								</SelectContent>
							</Select>
						)}
					{showValueInput && filterSettings.type === 'multiselect' &&
						!filterSettings.is_dynamic && (
							<Select
								value={filter.value}
								onValueChange={(value) =>
									onChange('value', value)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{map(
										filterSettings.options,
										(label, value) => (
											<SelectItem
												key={value}
												value={value}
											>
												{label}
											</SelectItem>
										)
									)}
								</SelectContent>
							</Select>
						)}
					{showValueInput &&
						filterSettings.type === 'select' &&
						filterSettings.is_dynamic && (
							<MultiSelect
								options={options.map((option) => ({
									label: option.label,
									value: String(option.value),
								}))}
								selected={map(filter.value, (value) => ({
									label:
										options.find(
											(option) =>
												String(option.value) ===
												String(value)
										)?.label || String(value),
									value: String(value),
								}))}
								onChange={(selectedOptions) =>
									onChange(
										'value',
										selectedOptions.map(
											(item) => item.value
										)
									)
								}
								isLoading={loading}
								onSearchChange={(value) => setKeyword(value)}
								placeholder={__(
									'Select options...',
									'doublescale'
								)}
								searchPlaceholder={__('Search...', 'doublescale')}
							/>
						)}
					{showValueInput && filterSettings.type === 'date' && (
						<>
							{filter.operator === 'within' ? (
								<WithinDaysInput
									value={filter.value}
									onChange={(days) =>
										onChange('value', days)
									}
									className={datePickerClassName}
								/>
							) : (
								<DatePicker
									buttonClassName={datePickerClassName}
									value={
										!isEmpty(filter.value)
											? filter.value
											: ''
									}
									onChange={(value) => {
										onChange('value', value);
									}}
									placeholder={__('Select date', 'doublescale')}
									outputFormat="display"
								/>
							)}
						</>
					)}
				</div>
				<div
					onClick={onRemove}
					className="text-destructive hover:text-destructive cursor-pointer"
				>
					<DeleteIcon width={20} height={20} />
				</div>
			</div>
		</div>
	);
};

export default Filter;
