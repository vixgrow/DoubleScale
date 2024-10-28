/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Button, Input, DatePicker } from 'antd';
import en from 'antd/es/date-picker/locale/en_US';
import dayjs from 'dayjs';
import { DeleteOutlined } from '@ant-design/icons';
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

	const fetchOptions = async () => {
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
	};

	useEffect(() => {
		if (filterSettings.is_dynamic) {
			fetchOptions();
		}
	}, [keyword]);

	return (
		<div className="qcrm-filter">
			<div className="qcrm-filter-row">
				<div className="qcrm-filter-row-item">
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
					/>
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

								onChange('operator', value.value);
								setTimeout(() => {
									onChange('value', '');
								}, 0);
							}}
							options={map(
								filterSettings.options,
								(label, value) => ({
									label,
									value,
								})
							)}
							isSearchable={false}
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
										const newValue = isArray(filter.value) ? filter.value : [];
										newValue[0] = dayjs(value).format('YYYY-MM-DD');
										if (isEmpty(newValue[1])) {
											newValue[1] = dayjs(value).format('YYYY-MM-DD');
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
										const newValue = isArray(filter.value) ? filter.value : [];
										newValue[1] = dayjs(value).format('YYYY-MM-DD');
										if (isEmpty(newValue[0])) {
											newValue[0] = dayjs(value).format('YYYY-MM-DD');
										}
										onChange('value', newValue);
									}}
									locale={en}
								/>
							</>
						) : (
							<DatePicker
								value={
									!isEmpty(filter.value) ? isArray(filter.value) ? dayjs(filter.value[0]) : dayjs(filter.value) : null
								}
								onChange={(value) =>
									onChange('value', dayjs(value).format('YYYY-MM-DD'))
								}
								locale={en}
							/>
						)}
					</>
				)}
				<Button
					danger
					onClick={() => onRemove()}
					icon={<DeleteOutlined />}
				/>
			</div>
		</div>
	);
};

export default Filter;
