/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';
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
import { CustomFieldsGroup } from '@quillcrm/client';

interface GroupDialogProps {
	visible: boolean;
	onClose: () => void;
	onSave: (name: string) => Promise<boolean>;
	onUpdate: (groupId: number, name: string) => Promise<boolean>; // Removed slug parameter
	editingGroup?: CustomFieldsGroup | null;
}

export const GroupDialog: React.FC<GroupDialogProps> = ({
	visible,
	onClose,
	onSave,
	onUpdate,
	editingGroup = null,
}) => {
	const [name, setName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEditing = !!editingGroup;

	// Reset form when dialog opens or when editing group changes
	useEffect(() => {
		if (visible) {
			if (editingGroup) {
				setName(editingGroup.name || '');
			} else {
				setName('');
			}
		}
	}, [visible, editingGroup]);

	const handleSubmit = async () => {
		if (!name.trim()) return;

		setIsSubmitting(true);

		let success = false;
		if (isEditing && editingGroup) {
			success = await onUpdate(editingGroup.id, name.trim()); // Only pass name
		} else {
			success = await onSave(name.trim());
		}

		if (success) {
			setName('');
			onClose();
		}

		setIsSubmitting(false);
	};

	const handleClose = () => {
		setName('');
		onClose();
	};

	return (
		<Dialog open={visible} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={isEditing ? __('Edit Group', 'quillcrm') : __('Add Group', 'quillcrm')}
							subtitle={
								isEditing
									? __('Update the group information below.', 'quillcrm')
									: __('Add basic information below to add new Group.', 'quillcrm')
							}
							icon={<GradientGroupIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="qcrm-fields space-y-4">
					<Field
						label={__('Name', 'quillcrm')}
						value={name}
						onChange={setName}
						type="text"
						placeholder={__('Enter Group Name', 'quillcrm')}
					/>
				</div>

				<DialogFooter className="mt-6 w-full">
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting || !name.trim()}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isSubmitting
							? (isEditing ? __('Updating...', 'quillcrm') : __('Adding...', 'quillcrm'))
							: (isEditing ? __('Update', 'quillcrm') : __('Add', 'quillcrm'))
						}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};