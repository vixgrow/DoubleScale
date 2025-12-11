/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import type { TaxonomyItem, TaxonomyType } from '../index';
import {
	CustomDialogHeader,
	Field,
	GradientListIcon,
	GradientTagIcon,
} from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';

interface TaxonomyDialogProps {
	type: TaxonomyType;
	visible: boolean;
	selectedItem: TaxonomyItem | null;
	item: { name: string; description: string };
	isSaving: boolean;
	onClose: () => void;
	onSubmit: () => void;
	onItemChange: (item: { name: string; description: string }) => void;
	onSelectedItemChange: (item: TaxonomyItem) => void;
}

export const TaxonomyDialog: React.FC<TaxonomyDialogProps> = ({
	type,
	visible,
	selectedItem,
	item,
	isSaving,
	onClose,
	onSubmit,
	onItemChange,
	onSelectedItemChange,
}) => {
	const config = {
		list: {
			icon: <GradientListIcon />,
			editTitle: __('Edit List', 'quillcrm'),
			createTitle: __('Create List', 'quillcrm'),
			subtitle: __('Add basic information below to add new List', 'quillcrm'),
			nameLabel: __('List Name', 'quillcrm'),
			namePlaceholder: __('Enter List Name', 'quillcrm'),
			descriptionLabel: __('List Description', 'quillcrm'),
			descriptionPlaceholder: __('Enter List Description', 'quillcrm'),
		},
		tag: {
			icon: <GradientTagIcon />,
			editTitle: __('Edit Tag', 'quillcrm'),
			createTitle: __('Create Tag', 'quillcrm'),
			subtitle: __('Add basic information below to add new Tag', 'quillcrm'),
			nameLabel: __('Tag Name', 'quillcrm'),
			namePlaceholder: __('Enter Tag Name', 'quillcrm'),
			descriptionLabel: __('Tag Description', 'quillcrm'),
			descriptionPlaceholder: __('Enter Tag description', 'quillcrm'),
		},
	};

	const currentConfig = config[type];

	const handleNameChange = (value: string) => {
		if (selectedItem) {
			onSelectedItemChange({ ...selectedItem, name: value });
		} else {
			onItemChange({ ...item, name: value });
		}
	};

	const handleDescriptionChange = (value: string) => {
		if (selectedItem) {
			onSelectedItemChange({ ...selectedItem, description: value });
		} else {
			onItemChange({ ...item, description: value });
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
							title={selectedItem ? currentConfig.editTitle : currentConfig.createTitle}
							subtitle={currentConfig.subtitle}
							icon={currentConfig.icon}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="qcrm-fields space-y-4 mt-4">
					<Field
						label={currentConfig.nameLabel}
						value={selectedItem ? selectedItem.name : item.name}
						onChange={handleNameChange}
						type="text"
						placeholder={currentConfig.namePlaceholder}
					/>
					<Field
						label={currentConfig.descriptionLabel}
						value={
							selectedItem
								? (selectedItem.description ?? '')
								: item.description
						}
						onChange={handleDescriptionChange}
						type="textarea"
						placeholder={currentConfig.descriptionPlaceholder}
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

