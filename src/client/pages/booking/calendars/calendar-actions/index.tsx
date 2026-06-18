/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useState } from 'react';
/**
 * Internal dependencies
 */
import {
	EditIcon,
	TrashIcon,
	CalendarDeleteIcon,
	CloneIcon,
} from '@/components/booking';
import type { Calendar } from '@/types/booking';
import { useApi } from '@/hooks/booking';
import CloneEventModal from '../clone-event-modal';
import { map } from 'lodash';

import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Dialog,
	DialogContent,
	DialogFooter,
} from '@/components/ui/dialog';

const confirmationDialogClassName =
	'!flex !flex-col mx-1 w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-hidden gap-3 rounded-xl p-4 sm:mx-auto sm:p-6 !translate-x-[-50%] !translate-y-[-50%] z-[170010]';

interface CalendarActionsProps {
	calendar: Calendar;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	onSaved?: () => void;
	setCloneMessage: (message: boolean) => void;
	setDeleteCalendarMessage: (message: boolean) => void;
	setErrorMessage?: (message: string | null) => void;
	trigger: React.ReactNode;
}

// Popover and confirmation dialogs are siblings so closing the popover does
// not unmount the dialogs and the menu cannot stack above the modal.
const CalendarActions: React.FC<CalendarActionsProps> = ({
	calendar,
	onEdit,
	onDelete,
	onSaved,
	setCloneMessage,
	setDeleteCalendarMessage,
	setErrorMessage,
	trigger,
}) => {
	const { loading } = useApi();
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
	const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

	const closePopover = () => setIsPopoverOpen(false);

	const showDeleteModal = () => {
		closePopover();
		setIsModalDeleteOpen(true);
	};

	const handleDelete = () => {
		onDelete(calendar.id);
		setIsModalDeleteOpen(false);
		setDeleteCalendarMessage(true);
	};

	const handleDeleteCancel = () => {
		setIsModalDeleteOpen(false);
	};

	const showCloneModal = () => {
		closePopover();
		setIsCloneModalOpen(true);
	};

	const closeCloneModal = () => {
		setIsCloneModalOpen(false);
	};

	const handleEdit = () => {
		closePopover();
		onEdit(calendar.id);
	};

	return (
		<>
			<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
				<PopoverTrigger asChild>{trigger}</PopoverTrigger>
				<PopoverContent className="w-auto p-0 z-[160000]">
					<div className="flex flex-col gap-2.5 items-start text-color-primary-text w-full p-3">
						<Button
							onClick={handleEdit}
							className="w-full flex justify-start"
							variant="ghost"
						>
							<EditIcon />
							{__('Edit', 'doublescale')}
						</Button>
						<Button
							onClick={showCloneModal}
							className="w-full flex justify-start"
							variant="ghost"
						>
							<CloneIcon />
							{__('Clone Event', 'doublescale')}
						</Button>
						<Button
							onClick={showDeleteModal}
							className="w-full flex justify-start"
							variant="ghost"
						>
							<TrashIcon />
							{__('Delete', 'doublescale')}
						</Button>
					</div>
				</PopoverContent>
			</Popover>
			<Dialog
				open={isModalDeleteOpen}
				onOpenChange={(open) => {
					if (!open) handleDeleteCancel();
				}}
			>
				<DialogContent
					className={confirmationDialogClassName}
					overlayClassName="z-[170010]"
				>
					<div className="flex flex-col justify-center items-center rounded-lg">
						<div className="bg-[#EF44441F] p-4 rounded-lg">
							<CalendarDeleteIcon />
						</div>
						<p className="text-[#09090B] text-[20px] font-[700] mt-5 max-[768px]:text-lg text-center">
							{__(
								'Do you really you want to delete this Calendar?',
								'doublescale'
							)}
						</p>
						<span className="text-[#71717A] text-center max-[768px]:text-sm">
							{__(
								'Are you sure you want to delete this calendar? All the associate bookings and data will be deleted',
								'doublescale'
							)}
						</span>
					</div>
					<DialogFooter className="mt-5 !flex-row justify-end gap-2 sm:!flex-row">
						<Button
							variant="outline"
							onClick={handleDeleteCancel}
							disabled={loading}
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							onClick={handleDelete}
							disabled={loading}
							className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
						>
							{__('Delete Calendar', 'doublescale')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<CloneEventModal
				open={isCloneModalOpen}
				onClose={closeCloneModal}
				onSaved={() => {
					closeCloneModal();
					onSaved?.();
					setCloneMessage(true);
				}}
				calendar={calendar}
				excludedEvents={map(calendar.events, 'id')}
				setCloneMessage={setCloneMessage}
				setErrorMessage={setErrorMessage}
			/>
		</>
	);
};

export default CalendarActions;
