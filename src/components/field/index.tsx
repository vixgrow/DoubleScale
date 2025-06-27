/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Input, Typography, Checkbox, Switch, DatePicker } from 'antd';
import en from 'antd/es/date-picker/locale/en_US';
import dayjs from 'dayjs';
import type { InputProps } from 'antd';
import { map, isEmpty, isObject } from 'lodash';
import Select from 'react-select';

/**
 * Internal dependencies
 */
import './style.scss';
import { ListField, TagField, LinkTriggerField } from '@quillcrm/components';
import type { ReactSelectOptions } from '@quillcrm/client';
import ContactMappedFields from '../contact-mapped-fields';
import MappedFields from '../mapped-fields';
import APISelect from '../api-select';
import APIMappedFields from '../api-mapped-fields';

interface FieldProps {
	label?: string;
	type: string;
	options?: ReactSelectOptions;
	onChange: (value: any) => void;
	value: any;
	status?: InputProps['status'];
	fields?: {
		[key: string]: {
			label: string;
		};
	};
	endpoint?: string;
	multiple?: boolean;
	required?: boolean;
	helperText?: string;
	style?: React.CSSProperties;
}

const Field: React.FC<FieldProps> = ({
	label,
	type,
	options,
	onChange,
	value,
	status,
	fields,
	endpoint,
	multiple,
	helperText,
	style,
}) => {
	let fieldContent;

	switch (type) {
		case 'lists':
			fieldContent = (
				<ListField
					value={value || []}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'tags':
			fieldContent = (
				<TagField
					value={value || []}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'link-triggers':
			fieldContent = (
				<LinkTriggerField
					value={value || []}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'text':
		case 'number':
		case 'email':
		case 'url':
			fieldContent = (
				<Input
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					type={type}
					status={status || ''}
				/>
			);
			break;
		case 'textarea':
			fieldContent = (
				<Input.TextArea
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					status={status || ''}
				/>
			);
			break;
		case 'select':
			const selectOptions = options || [];
			fieldContent = (
				<Select
					value={
						value
							? selectOptions.find(
								(option) => option.value === value
							)
							: null
					}
					onChange={(value) => {
						if (!isObject(value)) {
							return;
						}
						onChange(value.value);
					}}
					options={selectOptions}
				/>
			);
			break;
		case 'multiselect':
			const multiOptions = map(options, (label, value) => ({
				label,
				value,
			}));
			fieldContent = (
				<Select
					onChange={(value) => {
						const values = value.map((val) => val.value);
						onChange(values);
					}}
					options={multiOptions}
					value={multiOptions.filter((option) =>
						value?.includes(option.value)
					)}
					isMulti
				/>
			);
			break;
		case 'checkbox':
			fieldContent = (
				<Checkbox
					checked={value}
					onChange={(e) => onChange(e.target.checked)}
				/>
			);
			break;
		case 'switch':
			fieldContent = (
				<Switch
					checked={value}
					onChange={(checked) => onChange(checked)}
				/>
			);
			break;
		case 'date':
			fieldContent = (
				<DatePicker
					value={!isEmpty(value) ? dayjs(value) : null}
					onChange={(value) =>
						onChange(dayjs(value).format('YYYY-MM-DD'))
					}
					locale={en}
				/>
			);
			break;
		case 'contact_mapped_fields':
			fieldContent = (
				<ContactMappedFields
					onChange={onChange}
					values={value}
					fields={fields || {}}
				/>
			);
			break;
		case 'api_select':
			fieldContent = (
				<APISelect
					onChange={onChange}
					value={value}
					endpoint={endpoint || ''}
					multiple={multiple || false}
				/>
			);
			break;
		case 'api_mapped_fields':
			fieldContent = (
				<APIMappedFields
					onChange={onChange}
					values={value}
					fields={fields || {}}
					endpoint={endpoint || ''}
				/>
			);
			break;
		case 'mapped_fields':
			fieldContent = (
				<MappedFields
					onChange={onChange}
					values={value}
					fields={fields || {}}
				/>
			);
			break;
		default:
			fieldContent = null;
	}

	return (
		<div className="qcrm-field" style={style || {}}>
			{label && (
				<div className="qcrm-field-label text-[#09090B] font-normal text-base">
					{label} <span className='text-red-600'>*</span>
				</div>
			)}
			<div className="qcrm-field-input">{fieldContent}</div>
			{helperText && <Typography.Text type="secondary">{helperText}</Typography.Text>}
		</div>
	);
};

export default Field;
