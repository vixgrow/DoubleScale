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
} from '@doublescale/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomFieldsGroup } from '@doublescale/client';

interface GroupDialogProps {
	visible: boolean;
	onClose: () => void;
	onSave: (name: string) => Promise<boolean>;
	onUpdate: (groupId: number, name: string) => Promise<boolean>;
	editingGroup?: CustomFieldsGroup | null;
}

export const GroupDialog: React.FC<
	GroupDialogProps & { currentScope?: string }
> = ({
	visible,
	onClose,
	onSave,
	onUpdate,
	editingGroup = null,
	currentScope = 'contact',
}) => {
	const [name, setName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [scope, setScope] = useState(currentScope);
	const isEditing = !!editingGroup;

	// Reset form when dialog opens or when editing group changes
	useEffect(() => {
		if (visible) {
			if (editingGroup) {
				setName(editingGroup.name || '');
				setScope(currentScope); // Always use the current scope from props
			} else {
				setName('');
				setScope(currentScope);
			}
		}
	}, [visible, editingGroup, currentScope]);

	const handleSubmit = async () => {
		if (!name.trim()) return;

		setIsSubmitting(true);

		let success = false;
		if (isEditing && editingGroup) {
			success = await onUpdate(editingGroup.id, name.trim()); // Only pass name and id
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
							title={
								isEditing
									? __('Edit Group', 'doublescale')
									: __('Add Group', 'doublescale')
							}
							subtitle={
								isEditing
									? __(
											'Update the group information below.',
											'doublescale'
										)
									: __(
											'Add basic information below to add new Group.',
											'doublescale'
										)
							}
							icon={<GradientGroupIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="doublescale-fields space-y-4">
					<Field
						label={__('Name', 'doublescale')}
						value={name}
						onChange={setName}
						type="text"
						placeholder={__('Enter Group Name', 'doublescale')}
					/>
				</div>

				<div className="doublescale-fields space-y-4">
					{/* Scope is now passed from parent component */}
					<div className="flex items-center gap-2 py-2">
						<span className="text-sm font-medium text-gray-500">
							{__('Scope:', 'doublescale')}
						</span>
						<span className="text-sm font-medium capitalize">
							{scope}
						</span>
					</div>
				</div>

				<DialogFooter className="mt-6 w-full">
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting || !name.trim() || !scope.trim()}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isSubmitting
							? isEditing
								? __('Updating...', 'doublescale')
								: __('Adding...', 'doublescale')
							: isEditing
								? __('Update', 'doublescale')
								: __('Add', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
