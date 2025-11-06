/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';
import { map, keys } from 'lodash';
/**
 * internal dependencies
 */
import {
	CustomDialogHeader,
	GradientGroupIcon,
	Field,
	NoticeBanner,
} from '@quillcrm/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomField, FieldDialogProps, NoticeMessage } from '@quillcrm/client';

export const FieldDialog: React.FC<
	FieldDialogProps & { currentScope?: string }
> = ({
	visible,
	onClose,
	field,
	groups,
	fieldTypes,
	onSave,
	currentScope = 'contact',
}) => {
		const [formData, setFormData] = useState<Partial<CustomField>>({
			name: '',
			type: '',
			group_id: groups[0]?.id || 0,
			scope: currentScope,
			attributes: null,
		});
		const [options, setOptions] = useState<string[]>(['']);
		const [isSubmitting, setIsSubmitting] = useState(false);
		const [notice, setNotice] = useState<NoticeMessage | null>(null);

		const showNotice = (noticeData: NoticeMessage) => {
			setNotice(noticeData);
		};

		const closeNotice = () => {
			setNotice(null);
		};

		useEffect(() => {
			if (field) {
				setFormData({
					name: field.name,
					type: field.type,
					group_id: field.group_id,
					scope: currentScope, // Use the current scope from props
					attributes: field.attributes,
				});
				// Load existing options if field has them
				if (field.attributes && Array.isArray(field.attributes)) {
					setOptions(
						field.attributes.length > 0 ? field.attributes : ['']
					);
				} else {
					setOptions(['']);
				}
			} else {
				setFormData({
					name: '',
					type: '',
					group_id: groups[0]?.id || 0,
					scope: '',
					attributes: null,
				});
				setOptions(['']);
			}
		}, [field, groups]);

		// Reset form when dialog opens
		useEffect(() => {
			if (visible) {
				// Clear any existing notice when dialog opens
				setNotice(null);

				if (field) {
					setFormData({
						name: field.name,
						type: field.type,
						group_id: field.group_id,
						scope: field.scope,
						attributes: field.attributes,
					});
					// Load existing options if field has them
					if (field.attributes && Array.isArray(field.attributes)) {
						setOptions(
							field.attributes.length > 0 ? field.attributes : ['']
						);
					} else {
						setOptions(['']);
					}
				} else {
					setFormData({
						name: '',
						type: '',
						group_id: groups[0]?.id || 0,
						scope: currentScope,
						attributes: null,
					});
					setOptions(['']);
				}
			}
		}, [visible, field, groups]);

		const typesOptions = map(keys(fieldTypes), (type) => ({
			label: fieldTypes[type].name,
			value: type,
		}));

		const groupOptions = groups.map((group) => ({
			label: group.name,
			value: group.id,
		}));

		// Helper functions for options management
		const addOption = () => {
			setOptions([...options, '']);
		};

		const removeOption = (index: number) => {
			if (options.length > 1) {
				const newOptions = options.filter((_, i) => i !== index);
				setOptions(newOptions);
			}
		};

		const updateOption = (index: number, value: string) => {
			const newOptions = [...options];
			newOptions[index] = value;
			setOptions(newOptions);
		};

		// Check if current field type needs options
		const needsOptions =
			formData.type === 'select' || formData.type === 'multiselect';

		// Reset options when field type changes
		useEffect(() => {
			if (!needsOptions) {
				setOptions(['']);
			}
		}, [formData.type, needsOptions]);

		// Update scope when currentScope changes
		useEffect(() => {
			setFormData((prev) => ({
				...prev,
				scope: currentScope,
			}));
		}, [currentScope]);

		const handleSubmit = async () => {
			if (
				!formData.name ||
				!formData.type ||
				!formData.group_id ||
				!formData.scope
			) {
				showNotice({
					type: 'error',
					message: __('Please fill all the required fields', 'quillcrm'),
				});
				setIsSubmitting(false);
				return;
			}

			// Validate options for select/multiselect fields
			if (needsOptions) {
				const validOptions = options.filter(
					(option) => option.trim() !== ''
				);
				if (validOptions.length === 0) {
					showNotice({
						type: 'error',
						message: __('Please add at least one option', 'quillcrm'),
					});
					setIsSubmitting(false);
					return;
				}
			}

			setIsSubmitting(true);
			const isNew = !field;

			// Prepare field data with options as attributes
			const fieldData = {
				...(isNew ? formData : { ...field, ...formData }),
				attributes: needsOptions
					? options.filter((option) => option.trim() !== '')
					: null,
				scope: formData.scope,
			} as CustomField;

			await onSave(fieldData, isNew);
			onClose();
			setIsSubmitting(false);
		};

		return (
			<Dialog open={visible} onOpenChange={onClose}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							<CustomDialogHeader
								title={field ? __('Edit Field') : __('Add Field')}
								subtitle={
									field
										? __('Edit the field information below.')
										: __(
											'Add basic information below to add new Field.'
										)
								}
								icon={<GradientGroupIcon />}
							/>
						</DialogTitle>
					</DialogHeader>

					{/* Notice Banner */}
					{notice && (
						<NoticeBanner notice={notice} closeNotice={closeNotice} />
					)}

					<div className="qcrm-fields space-y-4">
						<Field
							label={__('Name', 'quillcrm')}
							value={formData.name || ''}
							onChange={(value) =>
								setFormData({ ...formData, name: value })
							}
							type="text"
							placeholder={__('Enter Field Name', 'quillcrm')}
						/>

						{/* Scope is now passed from parent component */}
						<div className="flex items-center gap-2 py-2">
							<span className="text-sm font-medium text-gray-500">
								{__('Scope:', 'quillcrm')}
							</span>
							<span className="text-sm font-medium capitalize">
								{formData.scope}
							</span>
						</div>

						<Field
							label={__('Type', 'quillcrm')}
							value={formData.type || ''}
							onChange={(value) =>
								setFormData({ ...formData, type: value })
							}
							type="select"
							options={typesOptions}
							placeholder={__('Select Field Type', 'quillcrm')}
						/>

						<Field
							label={__('Group', 'quillcrm')}
							value={formData.group_id || 0}
							onChange={(value) =>
								setFormData({ ...formData, group_id: value })
							}
							type="select"
							options={groupOptions}
							placeholder={__('Select Field Group', 'quillcrm')}
						/>

						{/* Options field for select/multiselect types */}
						{needsOptions && (
							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-900">
									{__('Field Value Options', 'quillcrm')}
								</label>
								<div className="space-y-2">
									{options.map((option, index) => (
										<div
											key={index}
											className="flex gap-2 items-center"
										>
											<Field
												value={option}
												onChange={(value) =>
													updateOption(index, value)
												}
												type="text"
												placeholder={__(
													`Option ${index + 1}`,
													'quillcrm'
												)}
												style={{ flex: 1 }}
											/>
											{options.length > 1 && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														removeOption(index)
													}
													className="px-3"
												>
													×
												</Button>
											)}
										</div>
									))}
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={addOption}
										className="w-full"
									>
										{__('+ Add Option', 'quillcrm')}
									</Button>
								</div>
							</div>
						)}
					</div>

					<DialogFooter className="mt-6 w-full">
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting}
							size="xl"
							variant="gradient"
							className="w-full"
						>
							{isSubmitting
								? __('Submitting...', 'quillcrm')
								: __('Submit', 'quillcrm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	};
