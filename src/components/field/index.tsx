/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { map, isObject } from 'lodash';
import Select from 'react-select';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	ListField,
	TagField,
	LinkTriggerField,
	DynamicKeyValueInput,
} from '@quillcrm/components';
import type { ReactSelectOptions } from '@quillcrm/client';
import ContactMappedFields from '../contact-mapped-fields';
import MappedFields from '../mapped-fields';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import APISelect from '../api-select';
import APIMappedFields from '../api-mapped-fields';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';

interface FieldProps {
	label?: string;
	type: string;
	options?: ReactSelectOptions;
	onChange: (value: any) => void;
	value: any;
	status?: 'error' | 'warning' | 'success';
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
	placeholder?: string;
	settings?: {
		max_pairs?: number;
		key_placeholder?: string;
		value_placeholder?: string;
		key_label?: string;
		value_label?: string;
		allow_empty?: boolean;
		button_text?: string;
		ajax_action?: string;
		variant?: 'primary' | 'secondary' | 'danger';
		size?: 'small' | 'medium' | 'large';
	};
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
	required,
	style,
	placeholder,
	settings,
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
					className={cn(
						'h-12',
						status === 'error' &&
							'border-red-500 focus-visible:ring-red-500'
					)}
					placeholder={placeholder}
				/>
			);
			break;
		case 'textarea':
			fieldContent = (
				<Textarea
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					className={cn(
						status === 'error' &&
							'border-red-500 focus-visible:ring-red-500'
					)}
					placeholder={placeholder}
				/>
			);
			break;
		case 'select':
			const selectOptions = options || [];
			fieldContent = (
				<Select
					className="react-select-container"
					classNamePrefix="react-select"
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
					placeholder={placeholder}
					styles={{
						menu: (base: any) => ({
							...base,
							color: 'black',
						}),
					}}
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
					placeholder={placeholder}
					styles={{
						menu: (base: any) => ({
							...base,
							color: 'black',
						}),
					}}
				/>
			);
			break;
		case 'checkbox':
			fieldContent = (
				<Checkbox
					checked={value}
					onCheckedChange={(checked) => onChange(checked)}
				/>
			);
			break;
		case 'switch':
			fieldContent = (
				<Switch
					checked={value}
					onCheckedChange={(checked) => onChange(checked)}
				/>
			);
			break;
		case 'date':
			fieldContent = (
				<DatePicker
					value={value}
					onChange={(dateValue) => onChange(dateValue)}
					error={status === 'error'}
					required={required}
					placeholder="Select a date"
					outputFormat="iso"
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
		case 'dynamic_keyvalue':
			fieldContent = (
				<DynamicKeyValueInput
					value={value || []}
					onChange={onChange}
					maxPairs={settings?.max_pairs || 10}
					keyPlaceholder={settings?.key_placeholder || placeholder}
					valuePlaceholder={
						settings?.value_placeholder || placeholder
					}
					keyLabel={settings?.key_label || 'Key'}
					valueLabel={settings?.value_label || 'Value'}
					allowEmpty={settings?.allow_empty || false}
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
					{label}{' '}
					{required && <span className="text-red-600">*</span>}
				</div>
			)}
			<div className="qcrm-field-input">{fieldContent}</div>
			{helperText && <div className="text-ghost">{helperText}</div>}
		</div>
	);
};

export default Field;
