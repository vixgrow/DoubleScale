/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import type { List as ContactList } from '@quillcrm/client';
import {
	CustomDialogHeader,
	Field,
	GradientListIcon,
} from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';

interface ListDialogProps {
	visible: boolean;
	selectedList: ContactList | null;
	list: { name: string; description: string };
	isSaving: boolean;
	onClose: () => void;
	onSubmit: () => void;
	onListChange: (list: { name: string; description: string }) => void;
	onSelectedListChange: (list: ContactList) => void;
}

export const ListDialog: React.FC<ListDialogProps> = ({
	visible,
	selectedList,
	list,
	isSaving,
	onClose,
	onSubmit,
	onListChange,
	onSelectedListChange,
}) => {
	const handleNameChange = (value: string) => {
		if (selectedList) {
			onSelectedListChange({ ...selectedList, name: value });
		} else {
			onListChange({ ...list, name: value });
		}
	};

	const handleDescriptionChange = (value: string) => {
		if (selectedList) {
			onSelectedListChange({ ...selectedList, description: value });
		} else {
			onListChange({ ...list, description: value });
		}
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			onClose();
		}
	};

	return (
		<Dialog open={visible} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={
								selectedList
									? __('Edit List', 'quillcrm')
									: __('Create List', 'quillcrm')
							}
							subtitle={__(
								'Add basic information below to add new List',
								'quillcrm'
							)}
							icon={<GradientListIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="qcrm-fields space-y-4 mt-4">
					<Field
						label={__('List Name', 'quillcrm')}
						value={selectedList ? selectedList.name : list.name}
						onChange={handleNameChange}
						type="text"
					/>
					<Field
						label={__('List Description', 'quillcrm')}
						value={
							selectedList
								? (selectedList.description ?? '')
								: list.description
						}
						onChange={handleDescriptionChange}
						type="textarea"
					/>
				</div>

				<DialogFooter className="mt-6 w-full">
					<Button
						onClick={onSubmit}
						disabled={isSaving}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isSaving
							? __('Submitting...', 'quillcrm')
							: __('Submit', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
