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
import type { List as ContactList } from '@doublescale/client';
import {
	CustomDialogHeader,
	Field,
	GradientListIcon,
} from '@doublescale/components';
import { Button } from '@doublescale/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';

import { Checkbox } from '@/components/ui/checkbox';

interface ListDialogProps {
	visible: boolean;
	selectedList: ContactList | null;
	list: { name: string; description: string; is_public: boolean };
	isSaving: boolean;
	onClose: () => void;
	onSubmit: () => void;
	onListChange: (list: { name: string; description: string; is_public: boolean }) => void;
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

	const handleIsPublicChange = (checked: boolean) => {
		if (selectedList) {
			onSelectedListChange({ ...selectedList, is_public: checked });
		} else {
			onListChange({ ...list, is_public: checked });
		}
	};

	const isPublic = selectedList
		? selectedList.is_public !== false
		: list.is_public !== false;

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
									? __('Edit List', 'doublescale')
									: __('Create List', 'doublescale')
							}
							subtitle={__(
								'Add basic information below to add new List',
								'doublescale'
							)}
							icon={<GradientListIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="doublescale-fields space-y-4 mt-4">
					<Field
						label={__('List Name', 'doublescale')}
						value={selectedList ? selectedList.name : list.name}
						onChange={handleNameChange}
						type="text"
						placeholder={__('Enter List Name', 'doublescale')}
					/>
					<Field
						label={__('List Description', 'doublescale')}
						value={
							selectedList
								? (selectedList.description ?? '')
								: list.description
						}
						onChange={handleDescriptionChange}
						type="textarea"
						placeholder={__('Enter List Description', 'doublescale')}
					/>
					<div className="flex items-center gap-3">
						<Checkbox
							id="list-is-public"
							checked={isPublic}
							onCheckedChange={(checked) =>
								handleIsPublicChange(checked === true)
							}
						/>
						<label
							htmlFor="list-is-public"
							className="text-sm font-medium leading-none cursor-pointer"
						>
							{__(
								'Show on subscription preference page',
								'doublescale'
							)}
						</label>
					</div>
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
							? __('Submitting...', 'doublescale')
							: __('Submit', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
