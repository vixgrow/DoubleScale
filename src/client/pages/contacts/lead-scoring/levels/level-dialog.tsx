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
import { LeadScoringLevel } from './index';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LevelDialogProps {
	visible: boolean;
	selectedLevel: LeadScoringLevel | null;
	level: {
		name: string;
		slug: string;
		points: number;
	};
	isSaving: boolean;
	onClose: () => void;
	onSubmit: () => void;
	onLevelChange: (level: any) => void;
	onSelectedLevelChange: (level: LeadScoringLevel | null) => void;
}

export const LevelDialog: React.FC<LevelDialogProps> = ({
	visible,
	selectedLevel,
	level,
	isSaving,
	onClose,
	onSubmit,
	onLevelChange,
	onSelectedLevelChange,
}) => {
	const isEditing = !!selectedLevel;

	// Auto-generate slug from name
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;
		const slug = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');

		if (selectedLevel) {
			onSelectedLevelChange({
				...selectedLevel,
				name,
				slug,
			});
		} else {
			onLevelChange({
				...level,
				name,
				slug,
			});
		}
	};

	const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const points = parseInt(e.target.value) || 0;

		if (selectedLevel) {
			onSelectedLevelChange({
				...selectedLevel,
				points,
			});
		} else {
			onLevelChange({
				...level,
				points,
			});
		}
	};

	const currentData = selectedLevel || level;

	return (
		<Dialog open={visible} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? __('Edit Lead Scoring Level', 'quillcrm')
							: __('Create Lead Scoring Level', 'quillcrm')}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? __(
									'Update the lead scoring level details below.',
									'quillcrm'
								)
							: __(
									'Create a new lead scoring level to categorize your contacts based on their score.',
									'quillcrm'
								)}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					{/* Name */}
					<div className="grid gap-2">
						<Label htmlFor="name">
							{__('Level Name', 'quillcrm')}{' '}
							<span className="text-red-500">*</span>
						</Label>
						<Input
							id="name"
							placeholder={__(
								'e.g., Hot Lead, Warm Lead, Cold Lead',
								'quillcrm'
							)}
							value={currentData.name}
							onChange={handleNameChange}
							className="col-span-3"
						/>
					</div>

					{/* Points */}
					<div className="grid gap-2">
						<Label htmlFor="points">
							{__('Minimum Points Required', 'quillcrm')}{' '}
							<span className="text-red-500">*</span>
						</Label>
						<Input
							id="points"
							type="number"
							min="0"
							placeholder={__('Enter minimum points', 'quillcrm')}
							value={currentData.points}
							onChange={handlePointsChange}
						/>
						<p className="text-xs text-gray-500">
							{__(
								'Contacts with this score or higher will qualify for this level.',
								'quillcrm'
							)}
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={onClose}
						disabled={isSaving}
					>
						{__('Cancel', 'quillcrm')}
					</Button>
					<Button
						onClick={onSubmit}
						disabled={isSaving}
						variant="gradient"
					>
						{isSaving
							? __('Saving...', 'quillcrm')
							: isEditing
								? __('Update Level', 'quillcrm')
								: __('Create Level', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
