/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { pick, isObject, omit } from 'lodash';
import { useState, useRef, useEffect } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@doublescale/config';
import { map } from 'lodash';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import TrashIcon from '@doublescale/shared/icons/trash';
import Select from 'react-select';
import { cn } from '@/lib/utils';
import { getMappingSelectStyles } from './mapping-select-styles';
import { MerageTagsIcon, PlusIcon } from '@/components/icons';

interface ContactMappedFieldsFormProps {
	onChange: (value: { [key: string]: string }) => void;
	values: { [key: string]: string };
	fields: {
		[key: string]:
		| {
			label: {
				label: string;
				type: string;
			};
		}
		| {
			label: string;
		};
	};
}

interface MergeTagInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	formFieldMergeTags: Array<{
		label: string;
		value: string;
		fieldKey: string;
	}>;
}

/**
 * Reusable Input Component with Merge Tag Support
 */
const MergeTagInput: React.FC<MergeTagInputProps> = ({
	value,
	onChange,
	placeholder,
	formFieldMergeTags,
}) => {
	const [popoverOpen, setPopoverOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);

	/**
	 * Check if value contains merge tags
	 */
	const hasMergeTags = (val: string) => {
		return /\{\{[^}]+:[^}]+\}\}/.test(val);
	};

	/**
	 * Insert merge tag at cursor position
	 */
	const insertMergeTag = (mergeTag: string) => {
		const input = inputRef.current;
		const currentValue = value || '';

		if (input) {
			const cursorPosition = input.selectionStart || currentValue.length;
			const newValue =
				currentValue.slice(0, cursorPosition) +
				mergeTag +
				currentValue.slice(cursorPosition);

			onChange(newValue);

			setTimeout(() => {
				input.focus();
				const newPosition = cursorPosition + mergeTag.length;
				input.setSelectionRange(newPosition, newPosition);
			}, 0);
		} else {
			onChange(currentValue + mergeTag);
		}

		setPopoverOpen(false);
	};

	return (
		<div className="flex-1 relative">
			<Input
				ref={inputRef}
				className={`w-full pr-10 ${hasMergeTags(value || '')
					? 'border-primary/30 bg-primary/5'
					: ''
					}`}
				value={value || ''}
				onChange={(e) => onChange(e.target.value)}
				placeholder={
					placeholder ||
					__('Enter value or use merge tags', 'doublescale')
				}
			/>
			<Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={false}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						size="icon"
						className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 border-none bg-transparent p-0 text-[#3A3A99] shadow-none hover:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0"
						title={__('Insert merge tag', 'doublescale')}
					>
						<MerageTagsIcon width={24} height={24}/>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-80 max-h-96 overflow-y-auto z-[150300] pointer-events-auto"
					align="end"
				>
					<div className="space-y-2">
						<h4 className="font-semibold text-sm text-[#3F4254]">
							{__('Insert Form Field', 'doublescale')}
						</h4>
						<p className="text-xs text-[#9197A4]">
							{__(
								'Click to insert a merge tag from form fields',
								'doublescale'
							)}
						</p>
						<div className="space-y-1 mt-3">
							{formFieldMergeTags.map((tag) => (
								<Button
									key={tag.fieldKey}
									type="button"
									variant="ghost"
									className="w-full justify-start text-left h-auto py-3"
									onClick={() => insertMergeTag(tag.value)}
								>
									<div className="flex flex-col items-start w-full">
										<span className="font-medium text-sm text-[#3F4254]">
											{tag.label}
										</span>
										<span className="text-xs text-[#505255] font-mono italic">
											{tag.value}
										</span>
									</div>
								</Button>
							))}
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
};

const ContactMappedFieldsForm: React.FC<ContactMappedFieldsFormProps> = ({
	onChange,
	values,
	fields,
}) => {
	const contactFieldsGroups = ConfigAPI.getContactFieldsGroups();

	// Initialize other fields from values on mount
	const [otherFields, setOtherFields] = useState<
		Array<{ fieldLabel: string; fieldValue: string; id: string }>
	>(() => {
		const allowedFields = ['first_name', 'last_name', 'email'];
		const otherFieldsData: Array<{
			fieldLabel: string;
			fieldValue: string;
			id: string;
		}> = [];

		// Extract fields that are not in allowedFields
		Object.entries(values || {}).forEach(([key, value]) => {
			if (!allowedFields.includes(key) && value) {
				otherFieldsData.push({
					fieldLabel: key,
					fieldValue: value,
					id: `other_field_${key}`,
				});
			}
		});

		return otherFieldsData;
	});

	// Filter to only show first_name, last_name, and email
	const allowedFields = ['first_name', 'last_name', 'email'];
	const contactFields = contactFieldsGroups[0]?.fields
		? pick(contactFieldsGroups[0].fields, allowedFields)
		: {};

	// Sync otherFields back to values when component loads with existing data
	useEffect(() => {
		const allowedFields = ['first_name', 'last_name', 'email'];
		const existingOtherFields: Array<{
			fieldLabel: string;
			fieldValue: string;
			id: string;
		}> = [];

		Object.entries(values || {}).forEach(([key, value]) => {
			if (!allowedFields.includes(key)) {
				existingOtherFields.push({
					fieldLabel: key,
					fieldValue: value,
					id: `other_field_${key}`,
				});
			}
		});

		// Only update if there are existing other fields and local state is empty
		if (existingOtherFields.length > 0 && otherFields.length === 0) {
			setOtherFields(existingOtherFields);
		}
	}, [values]);

	// Helper function to get field label
	const getFieldLabel = (field: any): string => {
		if (typeof field.label === 'string') {
			return field.label;
		}
		return field.label?.label || '';
	};

	// Helper function to get field type
	const getFieldType = (field: any): string => {
		if (typeof field.label === 'object' && field.label.type) {
			return field.label.type;
		}
		return '';
	};

	// For form imports, filter to only show email-type fields
	let emailOptions = Object.entries(fields)
		.filter(([, field]) => getFieldType(field) === 'email')
		.map(([fieldKey, field]) => ({
			label: getFieldLabel(field),
			value: fieldKey,
		}));

	// Create merge tag options from form fields
	const formFieldMergeTags = Object.entries(fields).map(
		([fieldKey, field]) => ({
			label: getFieldLabel(field) || fieldKey,
			value: `{{form:${fieldKey}}}`,
			fieldKey: fieldKey,
		})
	);

	/**
	 * Add a new other field row
	 */
	const addOtherField = () => {
		const newField = {
			fieldLabel: '',
			fieldValue: '',
			id: `other_field_${Date.now()}`,
		};
		setOtherFields([...otherFields, newField]);
	};

	/**
	 * Remove an other field row
	 */
	const removeOtherField = (id: string) => {
		const updatedFields = otherFields.filter((field) => field.id !== id);
		setOtherFields(updatedFields);

		// Update parent values by removing the field
		const fieldToRemove = otherFields.find((field) => field.id === id);
		if (fieldToRemove && fieldToRemove.fieldLabel) {
			const newValues = { ...values };
			delete newValues[fieldToRemove.fieldLabel];
			onChange(newValues);
		}
	};

	/**
	 * Update other field data
	 */
	const updateOtherField = (
		id: string,
		key: 'fieldLabel' | 'fieldValue',
		value: string
	) => {
		const updatedFields = otherFields.map((field) =>
			field.id === id ? { ...field, [key]: value } : field
		);
		setOtherFields(updatedFields);

		// Sync with parent values
		const updatedField = updatedFields.find((field) => field.id === id);
		if (
			updatedField &&
			updatedField.fieldLabel &&
			updatedField.fieldValue
		) {
			// If fieldLabel changed, remove old key
			const oldField = otherFields.find((field) => field.id === id);
			const newValues = { ...values };

			if (
				oldField &&
				oldField.fieldLabel &&
				oldField.fieldLabel !== updatedField.fieldLabel
			) {
				delete newValues[oldField.fieldLabel];
			}

			// Add/update new key
			newValues[updatedField.fieldLabel] = updatedField.fieldValue;
			onChange(newValues);
		} else if (
			updatedField &&
			updatedField.fieldLabel &&
			!updatedField.fieldValue
		) {
			// If value is empty but label exists, update with empty value
			const newValues = { ...values };
			newValues[updatedField.fieldLabel] = updatedField.fieldValue;
			onChange(newValues);
		}
	};

	// Get all available contact fields for "Other Fields" dropdown
	// Exclude first_name, last_name, and email
	const excludedFields = ['first_name', 'last_name', 'email'];
	const allContactFieldOptions = map(contactFieldsGroups, (group) => ({
		label: group.label,
		options: map(omit(group.fields, excludedFields), (field, fieldKey) => ({
			label: field.label,
			value: fieldKey,
		})),
	})).filter((group) => group.options.length > 0); // Remove empty groups

	const mappingSelectStyles = getMappingSelectStyles();

	const readonlyContactClass =
		'h-10 w-full rounded-lg border border-border bg-[#EFF1F4] text-sm text-muted-foreground shadow-sm cursor-default disabled:opacity-100';

	return (

			<div className="overflow-visible rounded-xl border border-border bg-white p-6 ">
				<div className="mb-5">
					<h3 className="text-xl font-semibold leading-8 text-primaryText">
						{__('Map form fields', 'doublescale')}
					</h3>
					<p className="mt-2 text-sm leading-7 text-muted-foreground">
						{__(
							'Match each form question to a contact field. Add extra rows below for more attributes.',
							'doublescale'
						)}
					</p>
				</div>

					<div className="grid grid-cols-1 mb-2 gap-4 sm:grid-cols-2 sm:gap-5">
						<div className="text-sm font-semibold text-primaryText">
							<span>{__('Contact Field', 'doublescale')}</span>
							<span className="text-destructive">*</span>
						</div>
						<div className="text-sm font-semibold text-primaryText">
							<span>{__('Form Field', 'doublescale')}</span>
							<span className="text-destructive">*</span>
						</div>
					</div>
                    <div className="flex flex-col gap-5">
					{map(contactFields, (_, key) => {
						return (
							<div
								key={key}
								className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-6"
							>
								<div className="min-w-0">
									<Input
										value={contactFields[key].label}
										disabled
										className={cn(readonlyContactClass)}
									/>
								</div>
								<div className="min-w-0">
									{key === 'email' ? (
										<Select
											className="react-select-container w-full"
											classNamePrefix="react-select"
											placeholder={__(
												'Select form field',
												'doublescale'
											)}
											onChange={(value) => {
												if (!isObject(value)) {
													return;
												}

												onChange({
													...values,
													[key]: value.value,
												});
											}}
											value={
												values && values[key]
													? emailOptions.find(
															(option) =>
																option.value ===
																values[key]
														)
													: null
											}
											options={emailOptions}
											styles={mappingSelectStyles}
											isSearchable={false}
											menuPortalTarget={
												typeof document !== 'undefined'
													? document.body
													: null
											}
											menuPosition="fixed"
										/>
									) : (
										<div className="min-w-0">
											<MergeTagInput
												value={values?.[key] || ''}
												onChange={(newValue) => {
													onChange({
														...values,
														[key]: newValue,
													});
												}}
												formFieldMergeTags={
													formFieldMergeTags
												}
											/>
										</div>
									)}
								</div>
							</div>
						);
					})}
					</div>


				{/* Other Fields Section */}
				<div className="mt-5">
				
						<h3 className="text-xl font-semibold leading-8 text-primaryText">
							{__('Additional contact fields', 'doublescale')}
						</h3>
						<p className="mt-2 text-sm leading-7 text-muted-foreground">
							{__(
								'Map optional contact attributes or merge tags. Use “Add field” for another row.',
								'doublescale'
							)}
						</p>
				

					{otherFields.length > 0 && (
						<div className="mt-5 mb-2 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:gap-6">
							
							<div className="text-sm font-semibold text-primaryText sm:col-span-1">
								{__('Contact Field', 'doublescale')}
							</div>
							<div className="text-sm font-semibold text-primaryText sm:col-span-1">
								{__('Form Field', 'doublescale')}
							</div>
							<span className="hidden w-10 sm:block" aria-hidden />
						</div>
					)}

					<div className="flex flex-col gap-5">
						{otherFields.map((field) => (
							<div
								key={field.id}
								className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_1fr_auto]  sm:gap-6"
							>
								<div className="min-w-0">
									<Select
										className="react-select-container w-full"
										classNamePrefix="react-select"
										onChange={(value) => {
											if (!isObject(value)) {
												return;
											}
											updateOtherField(
												field.id,
												'fieldLabel',
												value.value
											);
										}}
										value={
											field.fieldLabel
												? allContactFieldOptions
														.flatMap(
															(group) =>
																group.options
														)
														.find(
															(option) =>
																option.value ===
																field.fieldLabel
														)
												: null
										}
										options={allContactFieldOptions}
										styles={mappingSelectStyles}
										placeholder={__(
											'Select contact field',
											'doublescale'
										)}
										isSearchable={true}
										menuPortalTarget={
											typeof document !== 'undefined'
												? document.body
												: null
										}
										menuPosition="fixed"
									/>
								</div>

								<div className="min-w-0">
									<MergeTagInput
										value={field.fieldValue || ''}
										onChange={(newValue) =>
											updateOtherField(
												field.id,
												'fieldValue',
												newValue
											)
										}
										placeholder={__(
											'Select a form field or type a value',
											'doublescale'
										)}
										formFieldMergeTags={
											formFieldMergeTags
										}
									/>
								</div>

								<div className="flex justify-end sm:justify-center">
									<Button
										type="button"
										size="icon"
										variant="ghost"
										className="h-10 w-10 shrink-0 border border-destructive bg-white rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
										onClick={() => removeOtherField(field.id)}
										title={__(
											'Remove field',
											'doublescale'
										)}
									>
										<TrashIcon width={24} height={24} />
									</Button>
								</div>
							</div>
						))}
					</div>

					<Button
						type="button"
						variant="outline"
						className=" mt-5 w-full gap-2 rounded-lg border border-border bg-white text-primaryText hover:bg-[#F7F8FA] sm:w-auto"
						onClick={addOtherField}
					>
						<PlusIcon width={24} height={24} />
						{__('Add field', 'doublescale')}
					</Button>
				</div>
			</div>
	);
};

export default ContactMappedFieldsForm;

