/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useState } from 'react';
import { Check, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
/**
 * Internal dependencies
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@doublescale/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContactContext } from '../../state/context';
import {
	OutlinedCustomFieldsIcon,
} from '@doublescale/components';
import Field from '@doublescale/components/field';
import { getToLink } from '@doublescale/navigation';
import { useNavigate } from '@doublescale/navigation';
import EditHeaderIcon from '@doublescale/shared/icons/edit-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomFields } from '../../../../hooks/use-customFields';

type TabType = 'basic' | 'address' | 'custom';
type EditingField =
	| 'first_name'
	| 'last_name'
	| 'email'
	| 'phone'
	| 'whatsapp_phone'
	| 'address_1'
	| 'address_2'
	| 'country'
	| 'city'
	| 'state'
	| 'zip'
	| null;

const InfoCard: React.FC = () => {
	const { contact, updateContact } = useContactContext();

	const { groups = [], loading: isLoading = false } =
		useCustomFields('contact');
	const [activeTab, setActiveTab] = useState<TabType>('basic');
	const [editingField, setEditingField] = useState<EditingField>(null);
	const [editValue, setEditValue] = useState<string>('');
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [collapsedGroups, setCollapsedGroups] = useState<{
		[key: number]: boolean;
	}>({});
	const [editingCustomField, setEditingCustomField] = useState<number | null>(
		null
	);
	const [customFieldValue, setCustomFieldValue] = useState<
		string | boolean | string[]
	>('');
	const [isSavingCustomField, setIsSavingCustomField] =
		useState<boolean>(false);
	const navigate = useNavigate();
	const tabs = [
		{ id: 'basic' as TabType, label: __('Basic Information', 'doublescale') },
		{
			id: 'address' as TabType,
			label: __('Address Information', 'doublescale'),
		},
		{ id: 'custom' as TabType, label: __('Custom Fields', 'doublescale') },
	];

	const handleEdit = (field: EditingField, currentValue: string) => {
		setEditingField(field);
		setEditValue(currentValue || '');
	};

	const handleSave = async () => {
		if (editingField && contact && !isSaving) {
			setIsSaving(true);
			try {
				await updateContact({
					[editingField]: editValue,
				});
				setEditingField(null);
				setEditValue('');
			} catch (error) {
				console.error('Failed to update field:', error);
			} finally {
				setIsSaving(false);
			}
		}
	};

	const handleCancel = () => {
		setEditingField(null);
		setEditValue('');
	};

	const toggleGroupCollapse = (groupId: number) => {
		setCollapsedGroups((prev) => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	// Helper function to get custom field value from contact
	const getCustomFieldValue = (fieldId: number, fieldType?: string) => {
		const customField = contact?.custom_fields?.find(
			(cf) => cf.id === fieldId
		);
		const value = customField?.pivot?.value || '';

		// Convert string values to appropriate types
		if (fieldType === 'boolean' || fieldType === 'checkbox') {
			return value === 'true';
		}

		return value;
	};

	const handleEditCustomField = (
		fieldId: number,
		currentValue: string | boolean | string[]
	) => {
		setEditingCustomField(fieldId);
		setCustomFieldValue(currentValue || '');
	};

	const handleSaveCustomField = async () => {
		if (editingCustomField && contact && !isSavingCustomField) {
			setIsSavingCustomField(true);
			try {
				await updateCustomFieldValue(
					editingCustomField,
					customFieldValue
				);
				setEditingCustomField(null);
				setCustomFieldValue('');
			} catch (error) {
				console.error('Failed to update custom field:', error);
			} finally {
				setIsSavingCustomField(false);
			}
		}
	};

	const handleCancelCustomField = () => {
		setEditingCustomField(null);
		setCustomFieldValue('');
	};

	// Helper function to update custom field value
	const updateCustomFieldValue = async (
		fieldId: number,
		value: string | boolean | string[]
	) => {
		if (!contact) return;

		// Convert all values to strings for storage (API expects strings)
		let stringValue: string;
		if (typeof value === 'boolean') {
			stringValue = value.toString();
		} else if (Array.isArray(value)) {
			// For multiselect, join array values with commas
			stringValue = value.join(',');
		} else {
			stringValue = value;
		}

		const existingFieldIndex =
			contact.custom_fields?.findIndex((cf) => cf.id === fieldId) ?? -1;
		let updatedCustomFields = [...(contact.custom_fields || [])] as any[];

		if (existingFieldIndex >= 0) {
			// Update existing field
			updatedCustomFields[existingFieldIndex] = {
				...updatedCustomFields[existingFieldIndex],
				pivot: {
					...updatedCustomFields[existingFieldIndex].pivot,
					value: stringValue,
				},
			};
		} else {
			// Add new field (find field definition from groups)
			const fieldDefinition = groups
				.flatMap((group) => group.custom_fields)
				.find((field) => field.id === fieldId);

			if (fieldDefinition) {
				updatedCustomFields.push({
					...fieldDefinition,
					pivot: { value: stringValue } as any,
				});
			}
		}

		// Update contact and save to API
		await updateContact({
			custom_fields: updatedCustomFields as any,
		});
	};

	// Helper function to get options from custom field attributes
	const getFieldOptions = (customField: any) => {
		if (!customField.attributes) {
			return [];
		}

		let options;

		// Check if attributes is directly an array (like ["ee1", "ee2"])
		if (Array.isArray(customField.attributes)) {
			options = customField.attributes;
		} else if (customField.attributes.options) {
			// Check if attributes has an options property
			options = customField.attributes.options;
		} else {
			return [];
		}

		// If options is already in correct format [{label, value}]
		if (
			Array.isArray(options) &&
			options.length > 0 &&
			typeof options[0] === 'object' &&
			options[0].label &&
			options[0].value
		) {
			return options;
		}

		// If options is an object {value: label}
		if (typeof options === 'object' && !Array.isArray(options)) {
			return Object.entries(options).map(([value, label]) => ({
				value,
				label: String(label),
			}));
		}

		// If options is an array of strings
		if (
			Array.isArray(options) &&
			options.length > 0 &&
			typeof options[0] === 'string'
		) {
			return options.map((option) => ({
				value: option,
				label: option,
			}));
		}

		return [];
	};

	// Helper function to get formatted value for multiselect
	const getMultiselectValue = (fieldValue: string) => {
		if (!fieldValue) return [];
		return fieldValue.split(',').filter((val) => val.trim() !== '');
	};

	// Helper function to format custom field value for display
	const formatCustomFieldDisplay = (
		value: string | boolean | string[],
		fieldType: string,
		options?: { value: string; label: string }[]
	) => {
		if (value === '' || value === null || value === undefined) {
			return __('—', 'doublescale');
		}

		if (fieldType === 'boolean' || fieldType === 'checkbox') {
			return value === true || value === 'true'
				? __('Yes', 'doublescale')
				: __('No', 'doublescale');
		}

		if (fieldType === 'select' && options) {
			const option = options.find((opt) => opt.value === value);
			return option ? option.label : value;
		}

		if (fieldType === 'multiselect' && Array.isArray(value)) {
			if (value.length === 0) return __('—', 'doublescale');
			if (options) {
				return value
					.map((val) => {
						const option = options.find((opt) => opt.value === val);
						return option ? option.label : val;
					})
					.join(', ');
			}
			return value.join(', ');
		}

		return String(value);
	};

	const renderField = (
		fieldName: EditingField,
		label: string,
		value: string
	) => {
		const isEditing = editingField === fieldName;

		return (
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
					<label className="text-xs font-medium text-muted-foreground">
						{label}
					</label>
					{!isEditing ? (
						<Button
							size="sm"
							onClick={() => handleEdit(fieldName, value)}
							className="h-7 w-7 shrink-0 rounded-full bg-[#E4EEFD] p-0 shadow-none text-[#458DC7]"
						>
							<EditHeaderIcon width={16} height={16} color="#458DC7" />
						</Button>
					) : (
						<div className="flex gap-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleSave}
								disabled={isSaving}
								className="h-6 w-6 p-0 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSaving ? (
									<Loader2 className="h-4 w-4 text-green-600 animate-spin" />
								) : (
									<Check className="h-4 w-4 text-green-600" />
								)}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCancel}
								disabled={isSaving}
								className="h-6 w-6 p-0 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<X className="h-4 w-4 text-red-600" />
							</Button>
						</div>
					)}
				</div>
                {isEditing ? (
					<Input
						type={fieldName === 'email' ? 'email' : 'text'}
						value={editValue}
						onChange={(e) => {
							const newValue = e.target.value;
							// For phone fields, only allow numbers and +
							if (fieldName === 'phone' || fieldName === 'whatsapp_phone') {
								const phoneRegex = /^[0-9+]*$/;
								if (phoneRegex.test(newValue)) {
									setEditValue(newValue);
								}
							} else {
								setEditValue(newValue);
							}
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !isSaving) {
								handleSave();
							} else if (e.key === 'Escape' && !isSaving) {
								handleCancel();
							}
						}}
						disabled={isSaving}
						className="h-9 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
						autoFocus
						style={{ borderRadius: '0.5rem' }}
					/>
				) : (
					<div className="max-w-full truncate text-sm font-medium leading-snug text-foreground">
						{value || __('—', 'doublescale')}
					</div>
				)}
            </div>
        );
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case 'basic':
				return (
					<div className="flex flex-col gap-3">
						{renderField(
							'first_name',
							__('First Name', 'doublescale'),
							contact?.first_name || ''
						)}
						{renderField(
							'last_name',
							__('Last Name', 'doublescale'),
							contact?.last_name || ''
						)}
						{renderField(
							'email',
							__('Email', 'doublescale'),
							contact?.email || ''
						)}
						{renderField(
							'phone',
							__('Phone', 'doublescale'),
							contact?.phone || ''
						)}
						{renderField(
							'whatsapp_phone',
							__('WhatsApp Phone', 'doublescale'),
							contact?.whatsapp_phone || ''
						)}
					</div>
				);
			case 'address':
				return (
					<div className="flex flex-col gap-3">
						{renderField(
							'address_1',
							__('Address 1', 'doublescale'),
							contact?.address_1 || ''
						)}
						{renderField(
							'address_2',
							__('Address 2', 'doublescale'),
							contact?.address_2 || ''
						)}
						{renderField(
							'country',
							__('Country', 'doublescale'),
							contact?.country || ''
						)}
						{renderField(
							'city',
							__('City', 'doublescale'),
							contact?.city || ''
						)}
						{renderField(
							'state',
							__('State', 'doublescale'),
							contact?.state || ''
						)}
						{renderField(
							'zip',
							__('Zip', 'doublescale'),
							contact?.zip || ''
						)}
					</div>
				);
			case 'custom':
				if (isLoading) {
					return (
                        <div className="flex flex-col gap-4">
                            <Skeleton className='h-4 w-full' />
                            <Skeleton className='h-4 w-full' />
                            <Skeleton className='h-4 w-full' />
                        </div>
                    );
				}

				const hasCustomFields =
					groups &&
					groups.length > 0 &&
					groups.some(
						(group) =>
							group.custom_fields &&
							group.custom_fields.length > 0
					);

				if (!hasCustomFields) {
					return (
						<div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
							<OutlinedCustomFieldsIcon />
							<p className="text-sm font-medium">
								{__('No custom fields', 'doublescale')}
							</p>
							<Button
								onClick={() => {
									navigate(getToLink('custom-fields'));
								}}
								className="shadow-none"
								variant="secondary"
								size="default"
							>
								{__('Manage Custom Fields', 'doublescale')}
							</Button>
						</div>
					);
				}

				return (
					<div className="flex flex-col gap-3">
						{groups.map((group) => {
							if (
								!group.custom_fields ||
								group.custom_fields.length === 0
							) {
								return null;
							}

							const isCollapsed = collapsedGroups[group.id];

							return (
								<Card key={group.id} className="shadow-none">
									<CardHeader
										className={`px-4 py-2 ${!isCollapsed ? 'border-b rounded-t-xl' : 'rounded-xl'} bg-[#F8F8F8]`}
									>
										<CardTitle className="flex items-center justify-between text-sm font-semibold">
											<div className="flex items-center gap-2">
												<OutlinedCustomFieldsIcon
													width={18}
													height={18}
												/>
												{group.name}
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													toggleGroupCollapse(
														group.id
													)
												}
												className="h-8 w-8 p-0"
											>
												{isCollapsed ? (
													<ChevronDown className="h-6 w-6" />
												) : (
													<ChevronUp className="h-6 w-6" />
												)}
											</Button>
										</CardTitle>
									</CardHeader>
									{!isCollapsed && (
										<CardContent className="p-4">
											<div className="flex flex-col">
												{group.custom_fields.map(
													(customField, index) => {
														const fieldValue =
															getCustomFieldValue(
																customField.id,
																customField.type
															);

														// Get formatted value for multiselect
														const formattedValue =
															customField.type ===
															'multiselect'
																? getMultiselectValue(
																		fieldValue as string
																	)
																: fieldValue;

														// Get options for select/multiselect fields
														const fieldOptions = [
															'select',
															'multiselect',
														].includes(
															customField.type
														)
															? getFieldOptions(
																	customField
																)
															: undefined;

														const isEditing =
															editingCustomField ===
															customField.id;

														return (
															<div
																key={
																	customField.id
																}
																className={`flex flex-col gap-0.5 py-3 ${
																	index !==
																	group
																		.custom_fields
																		.length -
																		1
																		? 'border-b'
																		: ''
																}`}
															>
																<div className="flex items-center justify-between gap-2">
																	<label className="text-xs font-medium text-muted-foreground">
																		{
																			customField.name
																		}
																	</label>
																	{!isEditing ? (
																		<Button
																			size="sm"
																			onClick={() =>
																				handleEditCustomField(
																					customField.id,
																					formattedValue
																				)
																			}
																			className="h-7 w-7 shrink-0 rounded-full bg-primary/10 p-0 text-primary shadow-none"
																		>
																			<EditHeaderIcon width={16} height={16} color="#458DC7" />
																		</Button>
																	) : (
																		<div className="flex gap-1">
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={
																					handleSaveCustomField
																				}
																				disabled={
																					isSavingCustomField
																				}
																				className="h-6 w-6 p-0 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
																			>
																				{isSavingCustomField ? (
																					<Loader2 className="h-4 w-4 text-green-600 animate-spin" />
																				) : (
																					<Check className="h-4 w-4 text-green-600" />
																				)}
																			</Button>
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={
																					handleCancelCustomField
																				}
																				disabled={
																					isSavingCustomField
																				}
																				className="h-6 w-6 p-0 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
																			>
																				<X className="h-4 w-4 text-red-600" />
																			</Button>
																		</div>
																	)}
																</div>
																{isEditing ? (
																	<div
																		className="text-sm font-medium"
																		style={{
																			pointerEvents:
																				isSavingCustomField
																					? 'none'
																					: 'auto',
																			opacity:
																				isSavingCustomField
																					? 0.5
																					: 1,
																		}}
																	>
																		<Field
																			type={
																				customField.type
																			}
																			value={
																				customFieldValue
																			}
																			options={
																				fieldOptions
																			}
																			onChange={(
																				value
																			) =>
																				setCustomFieldValue(
																					value
																				)
																			}
																		/>
																	</div>
																) : (
																	<div className="text-sm font-medium leading-snug text-foreground">
																		{formatCustomFieldDisplay(
																			formattedValue,
																			customField.type,
																			fieldOptions
																		)}
																	</div>
																)}
															</div>
														);
													}
												)}
											</div>
										</CardContent>
									)}
								</Card>
							);
						})}
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className="rounded-xl border border-border/50 bg-muted/15 p-1 shadow-sm">
			<div
				className="flex flex-wrap gap-1 rounded-lg bg-background/80 p-1 ring-1 ring-border/35"
				role="tablist"
			>
				{tabs.map((tab) => (
					<button
						type="button"
						key={tab.id}
						role="tab"
						aria-selected={activeTab === tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`relative min-h-9 flex-1 cursor-pointer rounded-md border-0 px-3 py-1.5 text-center text-xs font-medium transition-all sm:flex-none sm:px-3 sm:text-sm ${
							activeTab === tab.id
								? 'bg-background font-semibold text-primary shadow-sm ring-1 ring-border/50'
								: 'bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>
			<div className="px-2 py-3 sm:px-3">{renderTabContent()}</div>
		</div>
	);
};

export default InfoCard;
