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
import dayjs from 'dayjs';
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
} from '@quillcrm/client';
import { DeleteIcon } from '@quillcrm/components';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '../ui/date-range-picker';
import { DatePicker } from '@/components/ui/date-picker';
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
	onChange: (key: string, value: string | string[]) => void;
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
		<div className="qcrm-filter">
			<div className="qcrm-filter-row">
				<div className="w-[15%] text-muted-foreground font-medium">
					{filterSettings.name}
				</div>
				<div className="w-[85%] flex items-center gap-3">
					{filterSettings.operators && (
						<Select
							value={filter.operator}
							onValueChange={(value) =>
								onChange('operator', value)
							}
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
					{filterSettings.type === 'text' && (
						<Input
							value={filter.value}
							onChange={(e) => onChange('value', e.target.value)}
						/>
					)}
					{filterSettings.type === 'select' &&
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
					{filterSettings.type === 'select' &&
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
									'quillcrm'
								)}
								searchPlaceholder={__('Search...', 'quillcrm')}
							/>
						)}
					{filterSettings.type === 'date' && (
						<>
							{filter.operator === 'within' ? (
								<DateRangePicker
									className={datePickerClassName}
									value={{
										from:
											!isEmpty(filter.value) &&
											isArray(filter.value) &&
											filter.value[0]
												? new Date(filter.value[0])
												: null,
										to:
											!isEmpty(filter.value) &&
											isArray(filter.value) &&
											filter.value[1]
												? new Date(filter.value[1])
												: null,
									}}
									onChange={(range) => {
										const newValue: string[] = [];
										if (range.from) {
											newValue[0] = dayjs(
												range.from
											).format('YYYY-MM-DD');
										}
										if (range.to) {
											newValue[1] = dayjs(
												range.to
											).format('YYYY-MM-DD');
										}
										onChange('value', newValue);
									}}
									placeholder={__(
										'Select date range',
										'quillcrm'
									)}
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
									placeholder={__('Select date', 'quillcrm')}
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
