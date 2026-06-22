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
	DisableIcon,
	CloneIcon,
	TrashIcon,
	CalendarDeleteIcon,
	CalendarDisableIcon,
} from '@/components/booking';
import type { Event } from '@/types/booking';
import { useApi } from '@/hooks/booking';

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

interface EventActionsProps {
	event: Partial<Event>;
	calendarId: number;
	isDisabled: boolean;
	updateCalendarEvents: () => void;
	setDisabledEvents: (eventId: number | undefined, disabled: boolean) => void;
	setStatusMessage: (message: boolean) => void;
	setDeleteMessage: (message: boolean) => void;
	setCloneMessage: (message: boolean) => void;
	setErrorMessage?: (message: string | null) => void;
	navigate: (path: string) => void;
	trigger: React.ReactNode;
}

// EventActions owns the popover, the four action buttons, and the two
// confirmation dialogs as siblings — so closing the popover does not unmount
// the dialogs. The parent passes only the trigger element (the "•••" button).
const EventActions: React.FC<EventActionsProps> = ({
	event,
	calendarId,
	isDisabled,
	updateCalendarEvents,
	setDisabledEvents,
	setStatusMessage,
	setDeleteMessage,
	setCloneMessage,
	setErrorMessage,
	navigate,
	trigger,
}) => {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
	const [isModalDisableOpen, setIsModalDisableOpen] = useState(false);

	const { callApi } = useApi();

	const closePopover = () => setIsPopoverOpen(false);

	const showDisableModal = () => {
		closePopover();
		setIsModalDisableOpen(true);
	};

	const handleDisable = (status: boolean) => {
		callApi({
			path: `events/${event.id}/disable-status`,
			method: 'PUT',
			data: { status },
			onSuccess: () => {
				setDisabledEvents(event.id, !isDisabled);
				setStatusMessage(!isDisabled);
			},
			onError: (error) => {
				if (setErrorMessage) {
					setErrorMessage(error);
				}
			},
		});
		setIsModalDisableOpen(false);
	};

	const handleDisableCancel = () => {
		setIsModalDisableOpen(false);
	};

	const showDeleteModal = () => {
		closePopover();
		setIsModalDeleteOpen(true);
	};

	const handleDelete = () => {
		callApi({
			path: `events/${event.id}`,
			method: 'DELETE',
			onSuccess: () => {
				updateCalendarEvents();
				setDeleteMessage(true);
			},
			onError: (error) => {
				if (setErrorMessage) {
					setErrorMessage(error);
				}
			},
		});
		setIsModalDeleteOpen(false);
	};

	const handleDeleteCancel = () => {
		setIsModalDeleteOpen(false);
	};

	const handleClone = () => {
		callApi({
			path: `events/duplicate`,
			method: 'POST',
			data: { id: event.id },
			onSuccess: () => {
				updateCalendarEvents();
				setCloneMessage(true);
			},
			onError: (error) => {
				if (setErrorMessage) {
					setErrorMessage(error);
				}
			},
		});
		closePopover();
	};

	const handleEdit = () => {
		closePopover();
		navigate(`booking/calendars/${calendarId}/events/${event.id}`);
	};

	return (
        <>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>{trigger}</PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <div className='flex flex-col gap-2.5 items-start text-color-primary-text'>
                        <Button
                            onClick={handleEdit}
                            className="w-full flex justify-start"
                            variant='ghost'>{<EditIcon />}
                            {__('Edit', 'doublescale')}
                        </Button>
                        <Button
                            onClick={showDisableModal}
                            className="w-full flex justify-start"
                            variant='ghost'>{<DisableIcon />}
                            {isDisabled
								? __('Enable', 'doublescale')
								: __('Disable', 'doublescale')}
                        </Button>
                        <Button
                            onClick={handleClone}
                            className="w-full flex justify-start"
                            variant='ghost'>{<CloneIcon />}
                            {__('Clone Event', 'doublescale')}
                        </Button>
                        <Button
                            onClick={showDeleteModal}
                            className="w-full flex justify-start"
                            variant='ghost'>{<TrashIcon />}
                            {__('Delete', 'doublescale')}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            <Dialog
                open={isModalDeleteOpen}
                onOpenChange={open => {
                    if (!open)
                        handleDeleteCancel();
                }}><DialogContent className="!flex !flex-col mx-1 w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-hidden gap-3 rounded-xl p-4 sm:mx-auto sm:w-full sm:p-8  !translate-x-[-50%] !translate-y-[-50%]">
                    <div className='flex flex-col justify-center items-center rounded-lg'>
                        <div className="bg-[#EF44441F] p-4 rounded-lg">
                            <CalendarDeleteIcon />
                        </div>
                        <p className="text-[#09090B] text-[20px] font-[700] mt-5">
                            {__(
                                'Do you really you want to delete this event?',
                                'doublescale'
                            )}
                        </p>
                        <span className="text-[#71717A]">
                            {__(
                                'by deleting this event you will not be able to restore it again!',
                                'doublescale'
                            )}
                        </span>
                    </div>
                    <DialogFooter className="mt-5 flex flex-row justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDeleteCancel}
                        >
                            {__('Cancel', 'doublescale')}
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
                        >
                            {__('Delete Event', 'doublescale')}
                        </Button>
                    </DialogFooter>
                </DialogContent></Dialog>
            <Dialog
                open={isModalDisableOpen}
                onOpenChange={open => {
                    if (!open)
                        handleDisableCancel();
                }}><DialogContent className="!flex !flex-col mx-1 w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-hidden gap-3 rounded-xl p-4 sm:mx-auto sm:w-full sm:p-8  !translate-x-[-50%] !translate-y-[-50%]">
                    <div className='flex flex-col justify-center items-center rounded-lg'>
                        <div className="bg-[#EF44441F] p-4 rounded-lg">
                            <CalendarDisableIcon />
                        </div>
                        <p className="text-[#09090B] text-[20px] font-[700] mt-5">
                            {isDisabled
                                ? __(
                                    'Do you really you want to enable this event?',
                                    'doublescale'
                                )
                                : __(
                                    'Do you really you want to disable this event?',
                                    'doublescale'
                                )}
                        </p>
                        <span className="text-[#71717A] text-center">
                            {isDisabled
                                ? __(
                                    'Enabling this event will make it available for booking',
                                    'doublescale'
                                )
                                : __(
                                    'by Disable this event you will not be able to Share or edit event untiled you Enable it again!',
                                    'doublescale'
                                )}
                        </span>
                    </div>
                    <DialogFooter className="mt-5 flex flex-row justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDisableCancel}
                        >
                            {__('Cancel', 'doublescale')}
                        </Button>
                        <Button
                            onClick={() => handleDisable(!isDisabled)}
                            className={
                                isDisabled
                                    ? 'bg-primary text-white'
                                    : 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
                            }
                        >
                            {isDisabled
                                ? __('Enable Event', 'doublescale')
                                : __('Disable Event', 'doublescale')}
                        </Button>
                    </DialogFooter>
                </DialogContent></Dialog>
        </>
    );
};

export default EventActions;
