/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { isObject } from 'lodash';
import Select from 'react-select';
import { Copy } from 'lucide-react';

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
import { Slider } from '@/components/ui/slider';
import PipelineStageChange from '../pipeline-stage-change';
import DealValueChange from '../deal-value-change';
import DealOwnerChange from '../deal-owner-change';
import DealCustomFieldChange from '../deal-custom-field-change';
import DiscountTypeWithAmount from '../discount-type-with-amount';
import CouponExpiryDate from '../coupon-expiry-date';
import OpenBuilder from '../open-builder';
import { DateTimePicker } from '../date-time-picker';

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
	min?: number;
	max?: number;
	className?: string;
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
	min,
	max,
	className,
}) => {
	const { createNotice } = useDispatch('quillcrm/core');

	const handleCopyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		createNotice({
			message: __('Copied to clipboard', 'quillcrm'),
			type: 'success',
		});
	};

	const renderHelperText = (helperText: string) => {
		// Check if helper text contains a merge tag pattern
		const mergeTagRegex = /\{\{[^}]+\}\}/g;
		const matches = helperText.match(mergeTagRegex);

		if (!matches) {
			return <div className="text-ghost">{helperText}</div>;
		}

		// Split the text and render with copy icons for merge tags
		const parts = helperText.split(mergeTagRegex);
		const result: React.ReactNode[] = [];

		for (let i = 0; i < parts.length; i++) {
			if (parts[i]) {
				result.push(<span key={`text-${i}`}>{parts[i]}</span>);
			}

			if (matches[i]) {
				result.push(
					<span
						key={`tag-${i}`}
						className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-mono cursor-pointer hover:bg-blue-100"
						onClick={() => handleCopyToClipboard(matches[i])}
						title={__('Click to copy', 'quillcrm')}
					>
						{matches[i]}
						<Copy className="h-3 w-3" />
					</span>
				);
			}
		}

		return <div className="text-ghost">{result}</div>;
	};

	let fieldContent;

	if (type === 'boolean') {
		type = 'switch';
	}

	switch (type) {
		case 'lists':
			fieldContent = (
				<ListField
					value={Array.isArray(value) ? value : []}
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
					value={Array.isArray(value) ? value : []}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'link-triggers':
			fieldContent = (
				<LinkTriggerField
					value={Array.isArray(value) ? value : []}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'text':
		case 'number':
		case 'email':
		case 'url':
		case 'password':
			fieldContent = (
				<Input
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					type={type}
					className={cn(
						'h-12 bg-white',
						status === 'error' &&
							'border-red-500 focus-visible:ring-red-500'
					)}
					style={{
						borderRadius: '8px',
					}}
					placeholder={placeholder}
					min={type === 'number' ? 0 : undefined}
					max={type === 'number' && max ? max : undefined}
				/>
			);
			break;
		case 'textarea':
			fieldContent = (
				<Textarea
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					className={cn(
						'bg-white',
						status === 'error' &&
							'border-red-500 focus-visible:ring-red-500'
					)}
					placeholder={placeholder}
					style={{
						borderRadius: '8px',
					}}
				/>
			);
			break;
		case 'select':
			const selectOptions = options || [];
			fieldContent = (
				<Select
					className="react-select-container bg-white"
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
						control: (styles) => ({
							...styles,
							borderRadius: '8px',
						}),
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
						control: (styles) => ({
							...styles,
							borderRadius: '8px',
						}),
						menu: (base: any) => ({
							...base,
							color: 'black',
						}),
					}}
				/>
			);
			break;
		case 'discount_type_with_amount':
			fieldContent = (
				<DiscountTypeWithAmount
					options={options}
					value={value}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'coupon_expiry_date':
			fieldContent = (
				<CouponExpiryDate
					value={value}
					onChange={(value) => onChange(value)}
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
		case 'slider':
			fieldContent = (
				<div className="w-full">
					<Slider
						min={min || 0}
						max={max || 100}
						value={[Number(value) || min || 0]}
						onValueChange={(newValue) =>
							onChange(String(newValue[0]))
						}
					/>
				</div>
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
		case 'open_builder':
			fieldContent = (
				<OpenBuilder
					initialEmailBody={value}
					onSave={(emailBodyJson) => onChange(emailBodyJson)}
				/>
			);
			break;
		case 'label':
			fieldContent = <div className="text-ghost">{value}</div>;
			break;
		case 'datetime':
			fieldContent = (
				<DateTimePicker
					value={value}
					onChange={(dateValue) => onChange(dateValue)}
					placeholder="Select date & time"
				/>
			);
			break;
		default:
			fieldContent = null;
	}

	// Special layout for switch - label before the switch with justify-between
	if (type === 'switch') {
		return (
			<div className="qcrm-field" style={style || {}}>
				<div className="flex items-center justify-between">
					{label && (
						<div className="qcrm-field-label text-[#09090B] font-normal text-base">
							<span>
								{label}{' '}
								{required && (
									<span className="text-red-600">*</span>
								)}
							</span>
						</div>
					)}
					<div className="qcrm-field-input">{fieldContent}</div>
				</div>
				{helperText && renderHelperText(helperText)}
			</div>
		);
	}

	// Special layout for checkbox - checkbox before label
	if (type === 'checkbox') {
		return (
			<div className="qcrm-field" style={style || {}}>
				<div className="flex items-center gap-3">
					<div className="qcrm-field-input">{fieldContent}</div>
					{label && (
						<div className="qcrm-field-label text-[#09090B] font-normal text-base">
							<span>
								{label}{' '}
								{required && (
									<span className="text-red-600">*</span>
								)}
							</span>
						</div>
					)}
				</div>
				{helperText && renderHelperText(helperText)}
			</div>
		);
	}

	// Default layout - label above the field
	return (
		<div className="qcrm-field" style={style || {}}>
			{label && (
				<div className="qcrm-field-label text-[#09090B] font-normal text-base flex items-center justify-between">
					<span>
						{label}{' '}
						{required && <span className="text-red-600">*</span>}
					</span>
				</div>
			)}
			<div className={cn('qcrm-field-input', className)}>
				{fieldContent}
			</div>
			{helperText && renderHelperText(helperText)}
		</div>
	);
};

export default Field;
