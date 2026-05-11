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
import CloneEventModal from '../clone-event-modal'; // Import the CloneEventModal component
import { map } from 'lodash';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
} from '@/components/ui/dialog';

// Define the props type
interface CalendarActionsProps {
	calendar: Calendar;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	onSaved?: () => void;
	setCloneMessage: (message: boolean) => void;
	setDeleteCalendarMessage: (message: boolean) => void;
	setErrorMessage?: (message: string | null) => void;
}

const CalendarActions: React.FC<CalendarActionsProps> = ({
	calendar,
	onEdit,
	onDelete,
	onSaved,
	setCloneMessage,
	setDeleteCalendarMessage,
	setErrorMessage,
}) => {
	const { loading } = useApi();
	const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
	const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

	const showDeleteModal = () => {
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
		setIsCloneModalOpen(true);
	};

	const closeCloneModal = () => {
		setIsCloneModalOpen(false);
	};

	return (
        <div
            className='flex flex-col gap-2.5 items-start text-color-primary-text w-full'>
            <Button
                onClick={() => onEdit(calendar.id)}
                className="w-full flex justify-start"
                variant='ghost'>{<EditIcon />} 
                {__('Edit', 'doublescale')}
            </Button>
            <Button
                onClick={showCloneModal}
                className="w-full flex justify-start"
                variant='ghost'>{<CloneIcon />} 
                {__('Clone Event', 'doublescale')}
            </Button>
            {/* <Button icon={<CloneIcon />} type="text" onClick={() => copyToClipboard(`${siteUrl}?doublescale_booking_calendar=${calendar.slug}`, __('Link copied', 'doublescale'))}>
                {__('Copy Link', 'doublescale')}
            </Button> */}
            <Button
                onClick={showDeleteModal}
                className="w-full flex justify-start"
                variant='ghost'>{<TrashIcon />} 
                {__('Delete', 'doublescale')}
            </Button>
            {/* Delete Confirmation Modal */}
            <Dialog
                open={isModalDeleteOpen}
                onOpenChange={open => {
                    if (!open)
                        handleDeleteCancel();
                }}><DialogContent>
                    <div className='flex flex-col justify-center items-center rounded-lg'>
                        <div className="bg-[#EF44441F] p-4 rounded-lg">
                            <CalendarDeleteIcon />
                        </div>
                        <p className="text-[#09090B] text-[20px] font-[700] mt-5">
                            {__(
                                'Do you really you want to delete this Calendar?',
                                'doublescale'
                            )}
                        </p>
                        <span className="text-[#71717A]">
                            {__(
                                'Are you sure you want to delete this calendar? All the associate bookings and data will be deleted',
                                'doublescale'
                            )}
                        </span>
                    </div>
                    <DialogFooter className="mt-5">
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
                </DialogContent></Dialog>
            {/* Clone Event Modal */}
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
        </div>
    );
};

export default CalendarActions;
