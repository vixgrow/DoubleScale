/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';

/**
 * External dependencies
 */
import { isObject } from 'lodash';
import Select from 'react-select';
import { Copy, HelpCircle } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	ListField,
	TagField,
	DynamicKeyValueInput,
	TestButton,
} from '@doublescale/components';
import type { ReactSelectOptions } from '@doublescale/client';
import ContactMappedFields from '../contact-mapped-fields';
import MappedFields from '@/components/mapped-fields';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import APISelect from '@/components/api-select';
import APIMappedFields from '@/components/api-mapped-fields';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { Slider } from '@/components/ui/slider';
import PipelineStageChange from '@/components/pipeline-stage-change';
import DealValueChange from '@/components/deal-value-change';
import DealOwnerChange from '@/components/deal-owner-change';
import EmailOpened from '@/components/email-opened';
import DealCustomFieldChange from '@/components/deal-custom-field-change';
import DiscountTypeWithAmount from '@/components/discount-type-with-amount';
import CouponExpiryDate from '@/components/coupon-expiry-date';
import OpenBuilder from '../open-builder';
import { DateTimePicker } from '@/components/date-time-picker';
import { FromEmailSelector } from '../from-email-selector';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipContent } from '@/components/ui/tooltip';
import { InfiniteScrollMultiSelect } from '@/components/infinite-scroll-select/infinite-scroll-multi-select';
import EmailClicked from '@/components/email-clicked';
import FormSubmission from '@/components/form-submission';
import PageVisited from '@/components/page-visited';
import LoggedInOut from '@/components/logged-in-out';
import WasActiveInactive from '@/components/was-active-inactive';
interface FieldProps {
	label?: string;
	type: string;
	// Options can be either react-select format array or raw object (for whatsapp_template)
	options?: ReactSelectOptions | Record<string, string>;
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
		templateData?: Record<string, any>;
		rootArrayResponse?: boolean;
		searchParamName?: string;
		perPage?: number;
		apiParams?: Record<string, unknown>;
		dataPath?: string;
		totalPath?: string;
	};
	allValues?: { [key: string]: any };
	defaultValue?: string;
	min?: number;
	max?: number;
	className?: string;
	tooltip?: string;
	disabled?: boolean;
	compact?: boolean;
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
	tooltip,
	disabled,
	compact = false,
}) => {
	const { createNotice } = useDispatch('doublescale/core');

	const handleCopyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		createNotice({
			message: __('Copied to clipboard', 'doublescale'),
			type: 'success',
		});
	};

	const renderLabelWithTooltip = () => {
		return (
			<span className="flex items-center gap-2">
				<span>
					{label}
					{required && (
						<span className="text-destructive ml-0.5" aria-hidden>
							*
						</span>
					)}
				</span>
				{tooltip && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
							</TooltipTrigger>
							<TooltipContent className="z-[160000] bg-popover border border-border w-60 text-popover-foreground text-xs">
								<p>{tooltip}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</span>
		);
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
						className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono cursor-pointer hover:bg-primary/15"
						onClick={() => handleCopyToClipboard(matches[i])}
						title={__('Click to copy', 'doublescale')}
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
			// Get LinkTriggerField from Pro plugin via filter
			const LinkTriggerFieldComponent = applyFilters(
				'doublescale_pro_component',
				null,
				'LinkTriggerField'
			) as React.ComponentType<{
				value: number[];
				onChange: (value: number[]) => void;
			}> | null;

			if (LinkTriggerFieldComponent) {
				fieldContent = (
					<LinkTriggerFieldComponent
						value={Array.isArray(value) ? value : []}
						onChange={(value) => onChange(value)}
					/>
				);
			} else {
				// Show Pro notice if component not available
				fieldContent = (
					<div
						style={{
							padding: '12px',
							backgroundColor: '#fff3cd',
							border: '1px solid #ffc107',
							borderRadius: '4px',
							color: '#856404',
						}}
					>
						<strong>{__('Pro Feature:', 'doublescale')}</strong>{' '}
						{__(
							'Link Triggers require DoubleScale Pro to be installed and activated.',
							'doublescale'
						)}
					</div>
				);
			}
			break;
		case 'from_email':
			fieldContent = (
				<FromEmailSelector
					value={value || ''}
					onChange={(email) => onChange(email)}
					error={status === 'error' ? 'error' : undefined}
					required={required}
					className={className}
				/>
			);
			break;
		case 'text':
		case 'number':
		case 'email':
		case 'tel':
		case 'phone':
		case 'url':
		case 'password':
			fieldContent = (
				<Input
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					type={type === 'phone' ? 'tel' : type}
					className={cn(
						'!rounded-lg !border-border h-12',
						status === 'error' &&
							'border-destructive focus-visible:ring-destructive/20',
						disabled && 'bg-muted cursor-not-allowed opacity-70',
						className
					)}
					placeholder={placeholder}
					min={type === 'number' ? 0 : undefined}
					max={type === 'number' && max ? max : undefined}
					disabled={disabled}
				/>
			);
			break;
		case 'textarea':
			fieldContent = (
				<Textarea
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					className={cn(
						'!rounded-lg !border-border',
						status === 'error' &&
							'border-destructive focus-visible:ring-destructive/20',
						className
					)}
					placeholder={placeholder}
				/>
			);
			break;
		case 'select':
			const selectOptions = options || [];
			fieldContent = (
				<Select
					className="react-select-container bg-card"
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
							height: '48px',
							borderColor: '#D3D4D6',
						}),
						menu: (base: any) => ({
							...base,
							color: 'black',
						}),
					}}
				/>
			);
			break;
		case 'infinite_scroll_multiselect': {
			const ims = settings;
			const ep = endpoint || '';
			if (!ep) {
				fieldContent = (
					<div className="text-sm text-destructive">
						{__('Missing endpoint for this field.', 'doublescale')}
					</div>
				);
				break;
			}
			fieldContent = (
				<InfiniteScrollMultiSelect
					value={
						Array.isArray(value)
							? value.map((v) =>
									typeof v === 'number' ? v : Number(v)
								)
							: []
					}
					onChange={(next) => onChange(next)}
					placeholder={
						placeholder || __('Search and add…', 'doublescale')
					}
					apiEndpoint={ep}
					apiParams={ims?.apiParams}
					searchParamName={ims?.searchParamName || 'search'}
					getOptionLabel={(item: unknown) => {
						const p = item as {
							name?: string;
							sku?: string;
						};
						const sku =
							p.sku && String(p.sku).trim()
								? ` (${String(p.sku)})`
								: '';
						return `${p.name ?? ''}${sku}`;
					}}
					getOptionValue={(item: unknown) =>
						(item as { id: number }).id
					}
					rootArrayResponse={ims?.rootArrayResponse === true}
					dataPath={ims?.dataPath}
					totalPath={ims?.totalPath}
					perPage={ims?.perPage ?? 20}
					disabled={disabled}
					className={className}
				/>
			);
			break;
		}
		case 'multiselect':
			const multiOptions = options || [];
			const selectedValues = Array.isArray(value)
				? value.map((item) => String(item).trim()).filter(Boolean)
				: typeof value === 'string' && value
					? value
							.split(',')
							.map((item) => item.trim())
							.filter(Boolean)
					: [];
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
						selectedValues.includes(String(option.value))
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
		case 'checkbox': {
			const checkboxOptions = options || [];
			const selectedCheckboxValues = Array.isArray(value)
				? value.map((item) => String(item).trim()).filter(Boolean)
				: typeof value === 'string' && value
					? value
							.split(',')
							.map((item) => item.trim())
							.filter(Boolean)
					: [];
			fieldContent = (
				<div className="space-y-1">
					{checkboxOptions.map((option) => {
						const optionValue = String(option.value);
						const selected = selectedCheckboxValues.includes(
							optionValue
						);
						return (
							<label
								key={optionValue}
								className="flex items-center gap-2 text-sm"
							>
								<input
									type="checkbox"
									disabled={disabled}
									checked={selected}
									onChange={(e) => {
										const current = [...selectedCheckboxValues];
										if (e.target.checked) {
											current.push(optionValue);
										} else {
											const idx = current.indexOf(optionValue);
											if (idx >= 0) {
												current.splice(idx, 1);
											}
										}
										onChange(current);
									}}
								/>
								{option.label}
							</label>
						);
					})}
				</div>
			);
			break;
		}
		case 'radio': {
			const radioOptions = options || [];
			const radioGroupName = `ds-radio-${String(label || 'group').replace(/\s+/g, '-')}`;
			fieldContent = (
				<div className="space-y-1">
					{radioOptions.map((option) => {
						const optionValue = String(option.value);
						return (
							<label
								key={optionValue}
								className="flex items-center gap-2 text-sm"
							>
								<input
									type="radio"
									name={radioGroupName}
									disabled={disabled}
									checked={String(value) === optionValue}
									onChange={() => onChange(optionValue)}
								/>
								{option.label}
							</label>
						);
					})}
				</div>
			);
			break;
		}
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
					keyPlaceholder={__('Enter key', 'doublescale')}
					valuePlaceholder={__('Enter value', 'doublescale')}
				/>
			);
			break;
		case 'whatsapp_template':
			// Get WhatsAppTemplateField from Pro plugin via filter
			// Templates are fetched from Meta API and use template_sid (external ID) as identifier
			const WhatsAppTemplateFieldComponent = applyFilters(
				'doublescale_pro_component',
				null,
				'WhatsAppTemplateField'
			) as React.ComponentType<{
				value: {
					template_sid?: string;
					template_variables?: Record<string, string>;
				};
				onChange: (value: {
					template_sid: string;
					template_variables: Record<string, string>;
				}) => void;
				options: Record<string, string>;
				templateData?: Record<string, any>;
			}> | null;

			if (WhatsAppTemplateFieldComponent) {
				// Options should be a Record<string, string> for whatsapp_template
				// (Fields component passes raw options object for this type)
				const templateOptions = (
					options && !Array.isArray(options) ? options : {}
				) as Record<string, string>;

				fieldContent = (
					<WhatsAppTemplateFieldComponent
						value={value || {}}
						onChange={onChange}
						options={templateOptions}
						templateData={settings?.templateData}
					/>
				);
			} else {
				// Fallback message if Pro not available
				fieldContent = (
					<div
						style={{
							padding: '12px',
							backgroundColor: '#fff3cd',
							border: '1px solid #ffc107',
							borderRadius: '4px',
							color: '#856404',
						}}
					>
						<strong>{__('Pro Feature:', 'doublescale')}</strong>{' '}
						{__(
							'WhatsApp Template Field requires DoubleScale Pro.',
							'doublescale'
						)}
					</div>
				);
			}
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
		case 'email_opened':
			fieldContent = (
				<EmailOpened
					value={value}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'email_clicked':
			fieldContent = (
				<EmailClicked
					value={value}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'page_visited':
			fieldContent = (
				<PageVisited
					options={options || []}
					value={value}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'form_submission':
			fieldContent = (
				<FormSubmission
					options={options || []}
					value={value}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'logged_in_out':
			fieldContent = (
				<LoggedInOut
					value={value}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'was_active_inactive':
			fieldContent = (
				<WasActiveInactive
					value={value}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		default:
			fieldContent = null;
	}

	// Special layout for switch - label before the switch with justify-between
	if (type === 'switch') {
		return (
			<div className="doublescale-field" style={style || {}}>
				<div className="flex items-center justify-between">
					{label && (
						<div className="doublescale-field-label text-foreground font-normal text-sm">
							{renderLabelWithTooltip()}
						</div>
					)}
					<div className="doublescale-field-input">
						{fieldContent}
					</div>
				</div>
				{helperText && renderHelperText(helperText)}
			</div>
		);
	}

	// List of complex field types that render multiple inputs
	const complexFieldTypes = [
		'page_visited',
		'form_submission',
		'logged_in_out',
		'was_active_inactive',
		'email_opened',
		'email_clicked',
	];

	const isComplexField = complexFieldTypes.includes(type);

	// Compact layout for complex fields or when compact prop is true
	if (isComplexField || compact) {
		return (
			<div
				className={cn(
					'doublescale-field doublescale-field-compact',
					compact && 'doublescale-field-compact-mode'
				)}
				style={style || {}}
			>
				{label && !compact && (
					<div className="doublescale-field-label text-foreground font-normal text-sm flex items-center justify-between mb-2">
						{renderLabelWithTooltip()}
					</div>
				)}
				<div className="doublescale-field-input doublescale-field-input-compact w-full min-w-0">
					{fieldContent}
				</div>
				{helperText && !compact && renderHelperText(helperText)}
			</div>
		);
	}

	// Default layout - label above the field
	return (
		<div className="doublescale-field w-full min-w-0" style={style || {}}>
			{label && (
				<div className="doublescale-field-label text-primaryText font-medium leading-6 text-sm flex flex-wrap items-center gap-x-1">
					{renderLabelWithTooltip()}
				</div>
			)}
			<div className="doublescale-field-input w-full min-w-0">
				{fieldContent}
			</div>
			{helperText && renderHelperText(helperText)}
		</div>
	);
};

export default Field;
