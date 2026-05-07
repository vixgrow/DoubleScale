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
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ColoredDeleteIcon } from '@doublescale/components';

interface DeleteConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	selectedCount: number;
	activeTab?: string;
}

const DeleteModal: React.FC<DeleteConfirmationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	selectedCount,
	activeTab,
}) => {
	// Get the appropriate item type and message based on the active tab
	const getDeleteMessage = () => {
		let itemType = '';
		let itemTypePlural = '';

		switch (activeTab) {
			case 'all':
				itemType = __('contact', 'doublescale');
				itemTypePlural = __('contacts', 'doublescale');
				break;
			case 'lists':
				itemType = __('list', 'doublescale');
				itemTypePlural = __('lists', 'doublescale');
				break;
			case 'tags':
				itemType = __('tag', 'doublescale');
				itemTypePlural = __('tags', 'doublescale');
				break;
			case 'custom-fields':
				itemType = __('field', 'doublescale');
				itemTypePlural = __('fields', 'doublescale');
				break;
			case 'notes':
				itemType = __('note', 'doublescale');
				itemTypePlural = __('notes', 'doublescale');
				break;
			case 'page_visits':
				itemType = __('page visit', 'doublescale');
				itemTypePlural = __('page visits', 'doublescale');
				break;
			default:
				itemType = __('item', 'doublescale');
				itemTypePlural = __('items', 'doublescale');
		}

		const displayType = selectedCount === 1 ? itemType : itemTypePlural;

		return {
			title: __('Confirm Deletion', 'doublescale'),
			message:
				selectedCount === 1
					? `${__('Do you really want to delete the selected', 'doublescale')} ${displayType}?`
					: `${__('Do you really want to delete the selected', 'doublescale')} ${selectedCount} ${displayType}?`,
			warning: __('This action cannot be undone.', 'doublescale'),
		};
	};

	const deleteMessage = getDeleteMessage();

	const handleConfirm = () => {
		onConfirm();
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogOverlay className="z-[150200]" />
			<DialogContent className="max-w-[38rem] p-8 z-[150200]">
				<DialogHeader>
					<div className="flex flex-col items-center justify-center gap-6">
						<div className="flex items-center justify-center rounded-3xl p-5 bg-[#FCDADA] text-[#EF4444]">
							<ColoredDeleteIcon />
						</div>
						<DialogTitle className="text-2xl font-bold text-[#09090B] text-center">
							{deleteMessage.message}
						</DialogTitle>
					</div>
				</DialogHeader>
				<DialogFooter className="flex gap-2 mt-4">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						className="flex-1"
					>
						{__('Back', 'doublescale')}
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleConfirm}
						className="flex-1"
					>
						{__('Yes, Delete', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DeleteModal;
