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
import { map, isEmpty, isArray } from 'lodash';
import Select from 'react-select';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Filter as FilterType, FilterSettings } from '../../../../types';

interface FilterProps {
	filterSettings: FilterSettings;
	filter: FilterType;
	onChange: (key: string, value: any) => void;
	onRemove: () => void;
}

const Filter: React.FC<FilterProps> = ({
	filterSettings,
	filter,
	onChange,
	onRemove,
}) => {
	const [options, setOptions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [keyword, setKeyword] = useState('');

	const fetchOptions = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs(filterSettings.dynamic_args.endpoint, {
					keyword,
					ids: isArray(filter.value) ? filter.value : '',
				}),
				method: 'GET',
			})) as any;

			setOptions(
				map(response.data, (item: any) => ({
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
						onChange={(value: any) =>
							onChange('operator', value.value)
						}
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
							onChange={(value: any) =>
								onChange('value', value.value)
							}
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
							onChange={(value: any) =>
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
					<DatePicker
						value={
							!isEmpty(filter.value) ? dayjs(filter.value) : null
						}
						onChange={(value) =>
							onChange('value', dayjs(value).format('YYYY-MM-DD'))
						}
						locale={en}
					/>
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
