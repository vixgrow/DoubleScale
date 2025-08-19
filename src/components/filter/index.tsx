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
import { map, isEmpty, isArray, isObject } from 'lodash';
import Select from 'react-select';

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
import { Button } from '@/components/ui/button';
import { DeleteIcon } from '@quillcrm/components';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '../ui/date-range-picker';
import { DatePicker } from '@/components/ui/date-picker';

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
		'rounded-md border border-input px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm bg-background h-12';
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
				<div className="qcrm-filter-row-item text-[#6E6E6E]">
					{filterSettings.name}
				</div>
				{filterSettings.operators && (
					<Select
						className="react-select-container"
						classNamePrefix="react-select"
						value={{
							label: filterSettings.operators[filter.operator],
							value: filter.operator,
						}}
						onChange={(value) => {
							if (!isObject(value)) {
								return;
							}

							onChange('operator', value.value);
						}}
						options={map(
							filterSettings.operators,
							(label, value) => ({
								label,
								value,
							})
						)}
						isSearchable={false}
						styles={{
							control: (base) => ({
								...base,
								width: '250px',
								height: '48px',
								minHeight: '48px',
								borderRadius: '8px',
							}),
							indicatorsContainer: (base) => ({
								...base,
								height: '48px',
							}),
							valueContainer: (base) => ({
								...base,
								height: '48px',
								padding: '0 8px',
							}),
							singleValue: (base) => ({
								...base,
								lineHeight: '48px',
							}),
							menu: (base: any) => ({
								...base,
								color: 'black',
							}),
						}}
					/>
				)}
				{filterSettings.type === 'text' && (
					<Input
						value={filter.value}
						onChange={(e) => onChange('value', e.target.value)}
						className="h-[48px] w-[250px]"
					/>
				)}
				{filterSettings.type === 'select' &&
					!filterSettings.is_dynamic && (
						<Select
							value={{
								label:
									filterSettings.options[filter.value] ||
									filter.value,
								value: filter.value,
							}}
							onChange={(value) => {
								if (!isObject(value)) {
									return;
								}

								onChange('value', value.value); // Fixed: was changing operator instead of value
							}}
							options={map(
								filterSettings.options,
								(label, value) => ({
									label,
									value,
								})
							)}
							isSearchable={false}
							styles={{
								control: (base) => ({
									...base,
									width: '250px',
									height: '48px',
									minHeight: '48px',
									borderRadius: '8px',
								}),
								indicatorsContainer: (base) => ({
									...base,
									height: '48px',
								}),
								valueContainer: (base) => ({
									...base,
									height: '48px',
									padding: '0 8px',
								}),
								singleValue: (base) => ({
									...base,
									lineHeight: '48px',
								}),
								menu: (base: any) => ({
									...base,
									color: 'black',
								}),
							}}
						/>
					)}
				{filterSettings.type === 'select' &&
					filterSettings.is_dynamic && (
						<Select
							value={map(filter.value, (value) => ({
								label:
									options.find(
										(option) => option.value === value
									)?.label || value,
								value,
							}))}
							onChange={(value) =>
								onChange(
									'value',
									map(value, (item) => item.value)
								)
							}
							options={options}
							isSearchable={true}
							isLoading={loading}
							onInputChange={(value) => setKeyword(value)}
							isMulti={true}
							styles={{
								control: (base) => ({
									...base,
									width: '250px',
									height: '48px',
									minHeight: '48px',
									borderRadius: '8px',
								}),
								indicatorsContainer: (base) => ({
									...base,
									height: '48px',
								}),
								valueContainer: (base) => ({
									...base,
									height: '48px',
									padding: '0 8px',
								}),
								singleValue: (base) => ({
									...base,
									lineHeight: '48px',
								}),
								menu: (base: any) => ({
									...base,
									color: 'black',
								}),
							}}
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
										newValue[0] = dayjs(range.from).format(
											'YYYY-MM-DD'
										);
									}
									if (range.to) {
										newValue[1] = dayjs(range.to).format(
											'YYYY-MM-DD'
										);
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
									!isEmpty(filter.value) ? filter.value : ''
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
				<Button
					size="icon"
					onClick={onRemove}
					className="bg-transparent shadow-none border-none p-0 text-destructive"
				>
					<DeleteIcon width={24} height={24} />
				</Button>
			</div>
		</div>
	);
};

export default Filter;
