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
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import './style.scss';
import {
	CustomDialogHeader,
	GradientAddToListIcon,
	GradientRemoveFromListIcon,
	PaginatedSelect,
} from '@doublescale/components';

interface AddRemoveListsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (selectedLists: number[]) => void;
	selectedCount: number;
	mode?: 'add' | 'remove';
	initialSelectedLists?: number[];
}

const AddRemoveListsModal: React.FC<AddRemoveListsModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	selectedCount,
	mode = 'add',
	initialSelectedLists = [],
}) => {
	const [selectedLists, setSelectedLists] = useState<number[]>([]);

	useEffect(() => {
		if (isOpen) {
			setSelectedLists(initialSelectedLists);
		} else {
			setSelectedLists([]);
		}
	}, [isOpen, initialSelectedLists]);

	const handleSubmit = () => {
		if (selectedLists.length === 0) {
			return;
		}
		onSubmit(selectedLists);
		handleClose();
	};

	const handleClose = () => {
		setSelectedLists([]);
		onClose();
	};

	const getModalContent = () => {
		if (mode === 'remove') {
			return {
				title: __('Remove From Lists', 'doublescale'),
				subtitle: __(
					'Select lists to remove contacts from',
					'doublescale'
				),
				description: __(
					`Remove ${selectedCount} contact(s) from the selected list(s)`,
					'doublescale'
				),
				selectLabel: __('Select List to Remove From', 'doublescale'),
				selectPlaceholder: __(
					'Select List to Remove From',
					'doublescale'
				),
				buttonText: __('Remove from Lists', 'doublescale'),
			};
		}

		return {
			title: __('Add To Lists', 'doublescale'),
			subtitle: __(
				'Add basic information below to add new List',
				'doublescale'
			),
			description: __(
				`Add ${selectedCount} contact(s) to the selected list(s)`,
				'doublescale'
			),
			selectLabel: __('Select List', 'doublescale'),
			selectPlaceholder: __('Select List', 'doublescale'),
			buttonText: __('Add to Lists', 'doublescale'),
		};
	};

	const content = getModalContent();

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					handleClose();
				}
			}}
		>
			<DialogContent
				className="z-[150200] max-w-md overflow-visible"
				overlayClassName="z-[150200]"
			>
				<DialogHeader className="flex flex-row items-center justify-between pb-4">
					<DialogTitle>
						<CustomDialogHeader
							title={content.title}
							subtitle={content.subtitle}
							icon={
								mode === 'remove' ? (
									<GradientRemoveFromListIcon />
								) : (
									<GradientAddToListIcon />
								)
							}
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
							value={selectedLists}
							onChange={setSelectedLists}
							endpoint="/doublescale/v1/lists"
							placeholder={content.selectPlaceholder}
							noOptionsMessage={__(
								'No lists available',
								'doublescale'
							)}
							renderMenuInPortal={false}
							className="doublescale-add-remove-lists-modal-select"
						/>
					</div>

					<div className="flex gap-2">
						<Button
							onClick={handleSubmit}
							disabled={selectedLists.length === 0}
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

export default AddRemoveListsModal;
