import Select from 'react-select';
import { useState, useEffect, useRef } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { Field } from '..';
import { Button } from '@/components/ui/button';
import { getCustomFieldAttributesMeta } from '@doublescale/shared/utils/custom-fields-validation';

interface CustomFieldEntry {
	custom_field_id: string;
	value: string | string[];
}

interface DealCustomFieldChangeProps {
	value: CustomFieldEntry[];
	onChange: (value: CustomFieldEntry[]) => void;
	options: any;
}

interface CustomFieldOption {
	label: {
		label: string;
		type: string;
		attributes: string[] | null;
	};
	value: string;
}

const DealCustomFieldChange = ({
	value,
	onChange,
	options,
}: DealCustomFieldChangeProps) => {
	const [customFieldEntries, setCustomFieldEntries] = useState<
		CustomFieldEntry[]
	>(value || []);

	const isInternalUpdate = useRef(false);

	const [currentFieldId, setCurrentFieldId] = useState<string>('');
	const [currentFieldValue, setCurrentFieldValue] = useState<
		string | string[]
	>('');
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [editingIndex, setEditingIndex] = useState<number>(-1);
	const [fieldExists, setFieldExists] = useState<boolean>(false);

	const customFields = options
		.filter((option: CustomFieldOption) => {
			return (
				!customFieldEntries.some(
					(entry) => entry.custom_field_id === option.value
				) ||
				(isEditing && currentFieldId === option.value)
			);
		})
		.map((option: CustomFieldOption) => ({
			label: option.label.label,
			value: option.value,
		}));

	const selectedOption = options.find(
		(option: CustomFieldOption) => option.value === currentFieldId
	);

	const fieldType = selectedOption?.label?.type || 'text';

	const fieldOptions = selectedOption?.label?.attributes
		? getCustomFieldAttributesMeta(selectedOption.label.attributes).options.map(
				(option) => ({
					label: option,
					value: option,
				})
			)
		: [];

	const isArrayFieldType =
		fieldType === 'multiselect' ||
		fieldType === 'checkbox' ||
		fieldType === 'multi-select';

	const selectedValue = customFields.find(
		(field) => field.value === currentFieldId
	);

	useEffect(() => {
		if (
			!isInternalUpdate.current &&
			JSON.stringify(value) !== JSON.stringify(customFieldEntries)
		) {
			setCustomFieldEntries(value || []);
		}

		isInternalUpdate.current = false;
	}, [value]);

	useEffect(() => {
		if (isInternalUpdate.current) {
			onChange(customFieldEntries);
		}
	}, [customFieldEntries, onChange]);

	useEffect(() => {
		if (currentFieldId) {
			const existingIndex = customFieldEntries.findIndex(
				(entry) => entry.custom_field_id === currentFieldId
			);

			if (existingIndex >= 0) {
				setFieldExists(true);
				if (!isEditing) {
					setCurrentFieldValue(
						customFieldEntries[existingIndex].value
					);
				}
			} else {
				setFieldExists(false);

				if (!isEditing) {
					const fieldOption = options.find(
						(option: CustomFieldOption) =>
							option.value === currentFieldId
					);

					if (isArrayFieldType) {
						setCurrentFieldValue([]);
					} else {
						setCurrentFieldValue('');
					}
				}
			}
		} else {
			setFieldExists(false);
		}
	}, [currentFieldId, customFieldEntries, isEditing, options]);

	const addFieldEntry = () => {
		if (!currentFieldId) return;

		const existingIndex = customFieldEntries.findIndex(
			(entry) => entry.custom_field_id === currentFieldId
		);

		isInternalUpdate.current = true;

		if (existingIndex >= 0) {
			const updatedEntries = [...customFieldEntries];
			updatedEntries[existingIndex] = {
				custom_field_id: currentFieldId,
				value: currentFieldValue,
			};
			setCustomFieldEntries(updatedEntries);
		} else {
			setCustomFieldEntries([
				...customFieldEntries,
				{
					custom_field_id: currentFieldId,
					value: currentFieldValue,
				},
			]);
		}

		setCurrentFieldId('');
		setCurrentFieldValue('');
		setIsEditing(false);
		setEditingIndex(-1);
		setFieldExists(false);
	};

	const startEditingField = (fieldId: string, index: number) => {
		const fieldToEdit = customFieldEntries.find(
			(entry) => entry.custom_field_id === fieldId
		);

		if (fieldToEdit) {
			setCurrentFieldId(fieldToEdit.custom_field_id);

			setCurrentFieldValue(fieldToEdit.value);
			setIsEditing(true);
			setEditingIndex(index);
		}
	};

	const cancelEditing = () => {
		setCurrentFieldId('');
		setCurrentFieldValue('');
		setIsEditing(false);
		setEditingIndex(-1);
		setFieldExists(false);
	};

	const removeFieldEntry = (fieldId: string) => {
		isInternalUpdate.current = true;

		setCustomFieldEntries(
			customFieldEntries.filter(
				(entry) => entry.custom_field_id !== fieldId
			)
		);
	};

	return (
		<div className="space-y-4">
			{customFieldEntries.length > 0 && (
				<div className="mb-6 border rounded p-4">
					<h3 className="font-medium mb-2">
						{__('Custom Fields', 'doublescale')}
					</h3>
					{customFieldEntries.map((entry, index) => {
						const fieldOption = options.find(
							(option: CustomFieldOption) =>
								option.value === entry.custom_field_id
						);
						const isBeingEdited =
							isEditing && editingIndex === index;

						return (
							<div
								key={index}
								className={`flex items-center justify-between mb-2 p-2 rounded ${
									isBeingEdited
										? 'bg-blue-50 border border-blue-200'
										: 'bg-gray-50'
								}`}
							>
								<div>
									<span className="font-medium">
										{fieldOption?.label?.label}:{' '}
									</span>
									<span>
										{Array.isArray(entry.value)
											? `[${entry.value.join(', ')}]`
											: (entry.value as string)}
									</span>
								</div>
								<div className="flex gap-2">
									{!isEditing && (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												startEditingField(
													entry.custom_field_id,
													index
												)
											}
										>
											{__('Edit', 'doublescale')}
										</Button>
									)}
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											removeFieldEntry(
												entry.custom_field_id
											)
										}
									>
										{__('Remove', 'doublescale')}
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{customFields.length > 0 || isEditing ? (
				<>
					<h3>
						{isEditing
							? __('Edit Custom Field', 'doublescale')
							: __('Add Custom Field', 'doublescale')}
					</h3>
					<div className="mb-4">
						<h4>{__('Field', 'doublescale')}</h4>
						<Select
							options={customFields}
							value={selectedValue}
							onChange={(option) =>
								setCurrentFieldId(option?.value || '')
							}
							className="mb-4"
							isDisabled={isEditing}
							placeholder={
								customFields.length === 0
									? __(
											'All custom fields have been added',
											'doublescale'
										)
									: __('Select a field', 'doublescale')
							}
							noOptionsMessage={() =>
								__(
									'All custom fields have been added',
									'doublescale'
								)
							}
						/>
						{fieldExists && !isEditing && (
							<div className="text-amber-600 text-sm mb-2">
								{__(
									'This field already exists. Adding will update its value.',
									'doublescale'
								)}
							</div>
						)}
					</div>

					{currentFieldId && (
						<div className="mb-4">
							<h4>{__('Value', 'doublescale')}</h4>
							<Field
								type={fieldType}
								value={currentFieldValue}
								onChange={(value) => {
									if (isArrayFieldType && !Array.isArray(value)) {
										setCurrentFieldValue(value ? [value] : []);
									} else {
										setCurrentFieldValue(value);
									}
								}}
								options={fieldOptions}
							/>
						</div>
					)}

					<div className="flex gap-2">
						<Button
							variant="default"
							onClick={addFieldEntry}
							disabled={!currentFieldId}
						>
							{isEditing
								? __('Save Changes', 'doublescale')
								: fieldExists
									? __('Update Field', 'doublescale')
									: __('Add Field', 'doublescale')}
						</Button>

						{isEditing && (
							<Button variant="outline" onClick={cancelEditing}>
								{__('Cancel', 'doublescale')}
							</Button>
						)}
					</div>
				</>
			) : customFieldEntries.length > 0 ? (
				<div className="text-green-600 p-3 bg-green-50 rounded border border-green-100">
					{__(
						'All available custom fields have been added.',
						'doublescale'
					)}
				</div>
			) : (
				<div className="text-blue-600 p-3 bg-blue-50 rounded border border-blue-100">
					{__('No custom fields available to add.', 'doublescale')}
				</div>
			)}
		</div>
	);
};

export default DealCustomFieldChange;
