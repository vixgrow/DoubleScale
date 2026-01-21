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
import { ColoredDeleteIcon } from '@quillcrm/components';

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
				itemType = __('contact', 'quillcrm');
				itemTypePlural = __('contacts', 'quillcrm');
				break;
			case 'lists':
				itemType = __('list', 'quillcrm');
				itemTypePlural = __('lists', 'quillcrm');
				break;
			case 'tags':
				itemType = __('tag', 'quillcrm');
				itemTypePlural = __('tags', 'quillcrm');
				break;
			case 'custom-fields':
				itemType = __('field', 'quillcrm');
				itemTypePlural = __('fields', 'quillcrm');
				break;
			case 'notes':
				itemType = __('note', 'quillcrm');
				itemTypePlural = __('notes', 'quillcrm');
				break;
			case 'page_visits':
				itemType = __('page visit', 'quillcrm');
				itemTypePlural = __('page visits', 'quillcrm');
				break;
			default:
				itemType = __('item', 'quillcrm');
				itemTypePlural = __('items', 'quillcrm');
		}

		const displayType = selectedCount === 1 ? itemType : itemTypePlural;

		return {
			title: __('Confirm Deletion', 'quillcrm'),
			message:
				selectedCount === 1
					? `${__('Do you really want to delete the selected', 'quillcrm')} ${displayType}?`
					: `${__('Do you really want to delete the selected', 'quillcrm')} ${selectedCount} ${displayType}?`,
			warning: __('This action cannot be undone.', 'quillcrm'),
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
						{__('Back', 'quillcrm')}
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleConfirm}
						className="flex-1"
					>
						{__('Yes, Delete', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DeleteModal;
