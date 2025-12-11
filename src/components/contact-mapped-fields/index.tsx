/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { pick, isObject, omit } from 'lodash';
import Select from 'react-select';
import { useState, useRef, useEffect } from 'react';
import { Hash, Plus, X } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import { map } from 'lodash';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import TrashIcon from '../icons/trash';

interface ContactMappedFieldsProps {
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
				className={`w-full bg-white h-12 pr-10 ${hasMergeTags(value || '')
					? 'border-blue-300 bg-blue-50/30'
					: ''
					}`}
				value={value || ''}
				onChange={(e) => onChange(e.target.value)}
				placeholder={
					placeholder ||
					__('Enter value or use merge tags', 'quillcrm')
				}
			/>
			<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						size="icon"
						className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-transparent border-none hover:bg-transparent text-primary p-0 shadow-none"
						title={__('Insert merge tag', 'quillcrm')}
					>
						<Hash className="h-4 w-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-80 max-h-96 overflow-y-auto z-[18000000]"
					align="end"
				>
					<div className="space-y-2">
						<h4 className="font-semibold text-sm text-[#3F4254]">
							{__('Insert Form Field', 'quillcrm')}
						</h4>
						<p className="text-xs text-[#9197A4]">
							{__(
								'Click to insert a merge tag from form fields',
								'quillcrm'
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

const ContactMappedFields: React.FC<ContactMappedFieldsProps> = ({
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

	return (
		<div className="flex gap-[10px] flex-col">
			<div className="flex gap-5">
				<div className="flex flex-1 text-[#09090B] font-normal text-base">
					{__('Contact Field')}
					<span className="text-red-600">*</span>
				</div>
				<div className="flex flex-1 text-[#09090B] font-normal text-base ml-7">
					{__('Field')} <span className="text-red-600">*</span>
				</div>
			</div>
			{map(contactFields, (_, key) => {
				return (
					<div key={key} className="flex gap-5">
						<Input
							value={contactFields[key].label}
							disabled
							className="flex-1 bg-white h-12 disabled:opacity-100"
							style={{
								borderRadius: '8px',
							}}
						/>
						{key === 'email' ? (
							<Select
								className="react-select-container h-12"
								classNamePrefix="react-select "
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
												option.value === values[key]
										)
										: null
								}
								options={emailOptions}
								styles={{
									control: (styles) => ({
										...styles,
										flex: 1,
										height: '48px',
										borderRadius: '6px',
										color: 'black',
									}),
									container: (styles) => ({
										...styles,
										flex: 1,
										height: '48px',
										borderRadius: '6px',
										color: 'black',
									}),
									menu: (base: any) => ({
										...base,
										color: 'black',
									}),
								}}
								isSearchable={false}
							/>
						) : (
							<MergeTagInput
								value={values?.[key] || ''}
								onChange={(newValue) => {
									onChange({
										...values,
										[key]: newValue,
									});
								}}
								formFieldMergeTags={formFieldMergeTags}
							/>
						)}
					</div>
				);
			})}

			{/* Other Fields Section */}
			<div className="flex flex-col gap-[10px] mt-6">
				<div className="flex items-center gap-2">
					<h3 className="text-[#09090B] font-medium text-base">
						{__('Other Fields', 'quillcrm')}
					</h3>
					<div
						className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center cursor-help"
						title={__(
							'Map additional contact fields to form fields or custom values',
							'quillcrm'
						)}
					>
						<span className="text-white text-xs">i</span>
					</div>
				</div>

				{otherFields.length > 0 && (
					<div className="flex gap-5">
						<div className="flex flex-1 text-[#09090B] font-normal text-base">
							{__('Field Label', 'quillcrm')}
						</div>
						<div className="flex flex-1 text-[#09090B] font-normal text-base ml-[14px]">
							{__('Field Value', 'quillcrm')}
						</div>
						<div className="w-12"></div>
					</div>
				)}

				{otherFields.map((field) => (
					<div key={field.id} className="flex gap-3 items-start">
						<div className="flex-1">
							<Select
								className="react-select-container h-12"
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
												(group) => group.options
											)
											.find(
												(option) =>
													option.value ===
													field.fieldLabel
											)
										: null
								}
								options={allContactFieldOptions}
								styles={{
									control: (styles) => ({
										...styles,
										flex: 1,
										height: '48px',
										borderRadius: '6px',
										color: 'black',
									}),
									container: (styles) => ({
										...styles,
										flex: 1,
										height: '48px',
										borderRadius: '6px',
										color: 'black',
									}),
									menu: (base: any) => ({
										...base,
										color: 'black',
									}),
								}}
								placeholder={__('Select', 'quillcrm')}
								isSearchable={true}
							/>
						</div>

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
								'Select a Field or Type Custom value',
								'quillcrm'
							)}
							formFieldMergeTags={formFieldMergeTags}
						/>

						<Button
							type="button"
							size="icon"
							className="shrink-0 text-destructive shadow-none border-none hover:bg-transparent hover:text-destructive p-0 bg-transparent h-12"
							onClick={() => removeOtherField(field.id)}
							title={__('Remove field', 'quillcrm')}
						>
							<TrashIcon width={20} height={20} />
						</Button>
					</div>
				))}

				<Button
					type="button"
					variant="secondaryDeepBlue"
					className="w-full mt-2 gap-2 rounded-md"
					onClick={addOtherField}
				>
					<Plus className="h-4 w-4" />
					{__('Add Field', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default ContactMappedFields;
