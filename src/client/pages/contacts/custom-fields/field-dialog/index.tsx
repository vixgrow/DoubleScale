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
} from '@quillcrm/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomField, FieldDialogProps } from '@quillcrm/client';

export const FieldDialog: React.FC<FieldDialogProps> = ({
	visible,
	onClose,
	field,
	groups,
	fieldTypes,
	onSave,
}) => {
	const [formData, setFormData] = useState<Partial<CustomField>>({
		name: '',
		type: '',
		group_id: groups[0]?.id || 0,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (field) {
			setFormData({
				name: field.name,
				type: field.type,
				group_id: field.group_id,
			});
		} else {
			setFormData({
				name: '',
				type: '',
				group_id: groups[0]?.id || 0,
			});
		}
	}, [field, groups]);

	const typesOptions = map(keys(fieldTypes), (type) => ({
		label: fieldTypes[type].name,
		value: type,
	}));

	const groupOptions = groups.map((group) => ({
		label: group.name,
		value: group.id,
	}));

	const handleSubmit = async () => {
		if (!formData.name || !formData.type || !formData.group_id) {
			return;
		}

		setIsSubmitting(true);
		const isNew = !field;
		const fieldData = isNew
			? ({ ...formData } as CustomField)
			: ({ ...field, ...formData } as CustomField);

		const success = await onSave(fieldData, isNew);
		if (success) {
			onClose();
		}
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

				<div className="qcrm-fields space-y-4 mt-4">
					<Field
						label={__('Name', 'quillcrm')}
						value={formData.name || ''}
						onChange={(value) =>
							setFormData({ ...formData, name: value })
						}
						type="text"
						placeholder={__('Enter Field Name', 'quillcrm')}
					/>

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
