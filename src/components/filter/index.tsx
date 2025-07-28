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
import { DatePicker } from 'antd';
import en from 'antd/es/date-picker/locale/en_US';
import dayjs from 'dayjs';
import { map, isEmpty, isArray, isObject, isString } from 'lodash';
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
	}, [filterSettings.is_dynamic, filterSettings.dynamic_args, keyword, filter.value]);

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
							}}
						/>
					)}
				{filterSettings.type === 'date' && (
					<>
						{filter.operator === 'within' ? (
							<>
								<DatePicker
									value={
										!isEmpty(filter.value)
											? isString(filter.value)
												? dayjs(filter.value)
												: dayjs(filter.value[0])
											: null
									}
									onChange={(value) => {
										const newValue = isArray(filter.value)
											? filter.value
											: [];
										newValue[0] =
											dayjs(value).format('YYYY-MM-DD');
										if (isEmpty(newValue[1])) {
											newValue[1] =
												dayjs(value).format(
													'YYYY-MM-DD'
												);
										}
										onChange('value', newValue);
									}}
									locale={en}
								/>
								<DatePicker
									value={
										!isEmpty(filter.value)
											? isString(filter.value)
												? dayjs(filter.value)
												: dayjs(filter.value[1])
											: null
									}
									onChange={(value) => {
										const newValue = isArray(filter.value)
											? filter.value
											: [];
										newValue[1] =
											dayjs(value).format('YYYY-MM-DD');
										if (isEmpty(newValue[0])) {
											newValue[0] =
												dayjs(value).format(
													'YYYY-MM-DD'
												);
										}
										onChange('value', newValue);
									}}
									locale={en}
								/>
							</>
						) : (
							<DatePicker
								value={
									!isEmpty(filter.value)
										? isArray(filter.value)
											? dayjs(filter.value[0])
											: dayjs(filter.value)
										: null
								}
								onChange={(value) =>
									onChange(
										'value',
										dayjs(value).format('YYYY-MM-DD')
									)
								}
								locale={en}
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