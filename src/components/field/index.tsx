/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { isObject } from 'lodash';
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
	TestButton,
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
import PipelineStageChange from '../pipeline-stage-change';
import DealValueChange from '../deal-value-change';
import DealOwnerChange from '../deal-owner-change';
import DealCustomFieldChange from '../deal-custom-field-change';

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
		ajax_action?: string;
		button_text?: string;
	};
	allValues?: { [key: string]: any };
	defaultValue?: string;
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
	allValues,
	defaultValue,
}) => {
	let fieldContent;

	if (type === 'boolean') {
		type = 'switch';
	}

	switch (type) {
		case 'lists':
			fieldContent = (
				<ListField
					value={value || []}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'pipeline_stage_change':
			fieldContent = (
				<PipelineStageChange
					endpoint={endpoint || ''}
					value={value}
					onChange={(value) => onChange(value)}
					allValues={allValues}
					defaultValue={defaultValue}
				/>
			);
			break;
		case 'deal_custom_field_change':
			fieldContent = (
				<DealCustomFieldChange
					value={Array.isArray(value) ? value : []}
					onChange={(value) => onChange(value)}
					options={options}
				/>
			);
			break;
		case 'deal_value_change':
			fieldContent = (
				<DealValueChange
					value={value}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'deal_owner_change':
			fieldContent = (
				<DealOwnerChange
					value={value}
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
			const multiOptions = options || [];
			fieldContent = (
				<Select
					onChange={(selectedOptions) => {
						const values = selectedOptions
							? selectedOptions.map((val) => val.value)
							: [];
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
					keyPlaceholder={__('Enter key', 'quillcrm')}
					valuePlaceholder={__('Enter value', 'quillcrm')}
				/>
			);
			break;
		case 'button':
		case 'test_button':
			fieldContent = (
				<TestButton
					label={label}
					settings={settings}
					allValues={allValues}
					onResult={(result) => onChange(result || value)}
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
