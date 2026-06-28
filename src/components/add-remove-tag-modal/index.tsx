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
	Dialog,
	DialogContent,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import './style.scss';
import {
	CustomDialogHeader,
	GradientTagIcon,
	PaginatedSelect,
} from '@doublescale/components';

interface AddRemoveTagsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (selectedTags: number[]) => void;
	selectedCount: number;
	mode?: 'add' | 'remove';
	initialSelectedTags?: number[];
}

const AddRemoveTagsModal: React.FC<AddRemoveTagsModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	selectedCount,
	mode = 'add',
	initialSelectedTags = [],
}) => {
	const [selectedTags, setSelectedTags] = useState<number[]>([]);

	useEffect(() => {
		if (isOpen) {
			setSelectedTags(initialSelectedTags);
		} else {
			setSelectedTags([]);
		}
	}, [isOpen, initialSelectedTags]);

	const handleSubmit = () => {
		if (selectedTags.length === 0) {
			return;
		}
		onSubmit(selectedTags);
		handleClose();
	};

	const handleClose = () => {
		setSelectedTags([]);
		onClose();
	};

	const getModalContent = () => {
		if (mode === 'remove') {
			return {
				title: __('Remove Tags', 'doublescale'),
				subtitle: __('Select tags to remove from contacts', 'doublescale'),
				description: __(
					`Remove selected tag(s) from ${selectedCount} contact(s)`,
					'doublescale'
				),
				selectLabel: __('Select Tag to Remove', 'doublescale'),
				selectPlaceholder: __('Select Tag to Remove', 'doublescale'),
				buttonText: __('Remove Tags', 'doublescale'),
			};
		}

		return {
			title: __('Add Tags', 'doublescale'),
			subtitle: __('Select tags to add to contacts', 'doublescale'),
			description: __(
				`Add selected tag(s) to ${selectedCount} contact(s)`,
				'doublescale'
			),
			selectLabel: __('Select Tag', 'doublescale'),
			selectPlaceholder: __('Select Tag', 'doublescale'),
			buttonText: __('Add Tags', 'doublescale'),
		};
	};

	const content = getModalContent();

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogOverlay className="z-[150200]" />
			<DialogContent className="max-w-md z-[150200]">
				<DialogHeader className="flex flex-row items-center justify-between pb-4">
					<DialogTitle>
						<CustomDialogHeader
							title={content.title}
							subtitle={content.subtitle}
							icon={<GradientTagIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-base text-black">
							{content.selectLabel}{' '}
							<span className="text-red-600">*</span>
						</label>
						<PaginatedSelect
							key={isOpen ? 'open' : 'closed'}
							value={selectedTags}
							onChange={setSelectedTags}
							endpoint="/doublescale/v1/tags"
							placeholder={content.selectPlaceholder}
							noOptionsMessage={__(
								'No tags available',
								'doublescale'
							)}
							className="doublescale-add-remove-tags-modal-select"
						/>
					</div>

					<div className="flex gap-2">
						<Button
							onClick={handleSubmit}
							disabled={selectedTags.length === 0}
							size="xl"
							variant={
								mode === 'remove' ? 'destructive' : 'gradient'
							}
							className="w-full"
						>
							{content.buttonText}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AddRemoveTagsModal;
