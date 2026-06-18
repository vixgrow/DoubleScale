/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { useApi } from '@/hooks/booking';
import type { Booking, NoticeMessage } from '@/types/booking';
import { useState } from '@wordpress/element';
import AddBookingModal from '@/components/booking/add-booking-modal';
import {
	CancelIcon,
	CancelledCalendarIcon,
	MarkIcon,
	RebookIcon,
	ResechduleIcon,
	SquareEditIcon,
	TrashIcon,
} from '@/components/booking';
import ConfigAPI from '@/config/booking';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

const Actions: Record<string, any> = applyFilters(
	'doublescale_booking_actions_actions',
	{
		rebook: {
			label: 'Rebook',
			action: 'rebook',
			icon: <RebookIcon />,
		},
		reschedule: {
			label: 'Reschedule',
			action: 'reschedule',
			icon: <ResechduleIcon />,
		},
		cancel: {
			label: 'Cancel',
			action: 'cancel',
			icon: <CancelIcon />,
		},
		delete: {
			label: 'Delete',
			action: 'delete',
			icon: <TrashIcon />,
		},
		completed: {
			label: 'Mark As Completed',
			action: 'mark_as_completed',
			icon: <MarkIcon />,
		},
	}
) as Record<string, any>;

const statues: Record<string, string[]> = applyFilters(
	'doublescale_booking_actions_statuses',
	{
		completed: ['delete', 'rebook'],
		cancelled: ['delete', 'rebook'],
		pending: ['cancel', 'delete', 'rebook', 'reschedule', 'completed'],
		scheduled: ['cancel', 'delete', 'rebook', 'reschedule', 'completed'],
		'no-show': ['delete', 'rebook'],
	}
) as Record<string, string[]>;

const confirmationDialogClassName =
	'!flex !flex-col mx-1 w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-hidden gap-3 rounded-xl p-4 sm:mx-auto sm:p-6 !translate-x-[-50%] !translate-y-[-50%] z-[160100]';

interface BookingActionsProps {
	booking: Booking;
	type: 'popover' | 'button';
	onStatusUpdated: (action?: string) => void;
	onNotice: (notice: NoticeMessage) => void;
}

const BookingActions: React.FC<BookingActionsProps> = ({
	booking,
	onStatusUpdated,
	type,
	onNotice,
}) => {
	const { callApi, loading } = useApi();
	const siteUrl = ConfigAPI.getSiteUrl();

	// State to handle modals
	const [cancelModalVisible, setCancelModalVisible] =
		useState<boolean>(false);
	const [deleteModalVisible, setDeleteModalVisible] =
		useState<boolean>(false);
	const [open, setOpen] = useState<boolean>(false);
	const [popoverVisible, setPopoverVisible] = useState<boolean>(false);
	const [cancelReason, setCancelReason] = useState<string>('');

	// API calls
	const updateStatus = async (status: string, reason?: string) => {
		const data = reason
			? { status, cancellation_reason: reason }
			: { status };
		callApi({
			path: `bookings/${booking.id}`,
			method: 'PUT',
			data,
			onSuccess: () => {
				onNotice({
					type: 'success',
					title: __('Success', 'doublescale'),
					message: __(
						'Booking status updated successfully',
						'doublescale'
					),
				});
				onStatusUpdated();
			},
			onError: (err: any) => {
				onNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message:
						err?.message ||
						__(
							'Failed to update booking status',
							'doublescale'
						),
				});
			},
		});
	};

	const deleteBooking = async () => {
		callApi({
			path: `bookings/${booking.id}`,
			method: 'DELETE',
			onSuccess: () => {
				onNotice({
					type: 'success',
					title: __('Success', 'doublescale'),
					message: __('Booking deleted successfully', 'doublescale'),
				});
				onStatusUpdated('delete');
			},
		});
	};

	// Handlers for opening modals
	const handleCancelClick = () => {
		setCancelModalVisible(true);
		setPopoverVisible(false);
	};

	const handleDeleteClick = () => {
		setDeleteModalVisible(true);
		setPopoverVisible(false);
	};

	const rebook = async () => {
		setOpen(true);
		setPopoverVisible(false);
	};

	const actionHandlers: Record<string, () => void> = applyFilters(
		'doublescale_booking_actions_handlers',
		{
			rebook: rebook,
			reschedule: () => {
				const redirectUrl = `${siteUrl}/?doublescale_booking=booking&id=${booking.hash_id}&type=reschedule`;
				(window.top || window).location.href = redirectUrl;
			},
			cancel: handleCancelClick,
			delete: handleDeleteClick,
			mark_as_completed: () => {
				updateStatus('completed');
			},
		},
		{ updateStatus, onStatusUpdated }
	) as Record<string, () => void>;

	const actionKeys: string[] = applyFilters(
		'doublescale_booking_actions_filtered_keys',
		statues[booking.status] ?? [],
		booking
	) as string[];

	const renderActionButton = (actionKey: string, type?: string) => {
		const action = Actions[actionKey];
		const style: Record<string, string> = applyFilters(
			'doublescale_booking_actions_styles',
			{
				email: 'bg-primary text-white border-primary',
				completed: 'bg-[#0EA473] text-white border-[#0EA473]',
				reschedule: 'bg-[#ECECEC] text-color-primary-text border-[#7C7C7C]',
				rebook: 'bg-[#5F5959] text-white border-[#5F5959]',
				delete: 'bg-white text-[#B3261E] border-[#B3261E]',
				cancel: 'bg-white text-[#EF4444] border-[#EF4444]',
			}
		) as Record<string, string>;
		const handler = actionHandlers[action.action];

		return type === 'popover' ? (
			<div
				className="w-full flex items-center cursor-pointer hover:bg-[#F0F0F0] p-1 rounded gap-2 px-3"
				key={action.action}
				onClick={() => {
					handler && handler();
					setPopoverVisible(false);
				}}
			>
				{action.icon}
				{action.label}
			</div>
		) : (
			<div
				className={`flex align-middle gap-2 py-2 px-4 cursor-pointer rounded-lg border ${style[actionKey]}`}
				key={action.action}
				onClick={() => {
					// For actions with modals, do nothing extra here
					if (
						action.action === 'cancel' ||
						action.action === 'delete'
					) {
						handler && handler();
					} else {
						handler && handler();
					}
				}}
			>
				{action.icon}
				{action.label}
			</div>
		);
	};

	return (
        <>
            {type === 'button' && (
				<div className='flex gap-2.5 items-center flex-nowrap'>
					{actionKeys.map((actionKey) =>
						renderActionButton(actionKey)
					)}
				</div>
			)}
            {type === 'popover' && (
				<Popover
					open={popoverVisible}
					onOpenChange={(visible) => setPopoverVisible(visible)}
				>
					<PopoverTrigger asChild>
						<Button className="doublescale-booking-edit-button bg-[#ACACAC] text-white px-2">{<SquareEditIcon width={13} height={13} />}
							{__('Edit', 'doublescale')}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-3">
						<div className='flex flex-col gap-2.5 items-start justify-start'>
							{actionKeys.map((actionKey) =>
								renderActionButton(actionKey, type)
							)}
						</div>
					</PopoverContent>
				</Popover>
			)}
            {open && (
				<AddBookingModal
					booking={booking}
					onClose={() => {
						setOpen(false);
					}}
					onSaved={() => {
						setOpen(false);
						onStatusUpdated();
					}}
					open={open}
				/>
			)}
            {/* Cancel Booking Modal */}
            <Dialog
                open={cancelModalVisible}
                onOpenChange={(open) => {
                    if (!open) {
                        setCancelModalVisible(false);
                        setCancelReason('');
                    }
                }}
            ><DialogContent className={confirmationDialogClassName} overlayClassName="z-[160100]"><DialogHeader><DialogTitle>{<div className="gap-2">
                                <div className="flex flex-col justify-center items-center mb-4">
                                    <div className="text-[#EF4444] bg-[#EF44441F] p-2 rounded-lg">
                                        <CancelledCalendarIcon width={56} height={56} />
                                    </div>
                                </div>
                                <p className="text-center text-color-primary-text text-xl font-bold max-[768px]:text-lg">
                                    {__(
                                        'Are you sure you want to cancel this booking?',
                                        'doublescale'
                                    )}
                                </p>
                                <p className="text-center text-[#71717A] font-normal max-[768px]:text-sm">
                                    {__(
                                        "by cancelling this booking you won't be able to restore it again!",
                                        'doublescale'
                                    )}
                                </p>
                            </div>}</DialogTitle></DialogHeader>
                    <div>
                        <label htmlFor="cancelReason">
                            {__('Reason for cancellation', 'doublescale')}
                            <span className="text-[#EF4444]">*</span>
                        </label>

                        <Textarea
                            className="rounded-xl"
                            id="cancelReason"
                            placeholder={__('Type your reason', 'doublescale')}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                        />

                        <div className="flex justify-end gap-2 mt-4">
                            <Button
                                variant="outline"

                                onClick={() => {
                                    setCancelModalVisible(false);
                                    setCancelReason('');
                                }}
                                size='lg'
                            >
                                {__('Back', 'doublescale')}
                            </Button>
                            <Button
                                disabled={!cancelReason.trim() || loading}
								variant="destructive"
                                className="text-white bg-[#EF4444]"
                                onClick={() => {
                                    updateStatus('cancelled', cancelReason);
                                    setCancelModalVisible(false);
                                    setCancelReason('');
                                }}
                                size='lg'
                            >
                                {__('Yes, Cancel', 'doublescale')}
                            </Button>
                        </div>
                    </div>
                </DialogContent></Dialog>
            {/* Delete Booking Modal */}
            <Dialog
                open={deleteModalVisible}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteModalVisible(false);
                    }
                }}
            ><DialogContent className={confirmationDialogClassName} overlayClassName="z-[160100]"><DialogHeader><DialogTitle>{<div className="gap-2">
                                <div className="flex flex-col justify-center items-center mb-4">
                                    <div className="text-[#EF4444] bg-[#EF44441F] p-2 rounded-lg max-[768px]:p-1.5">
                                        <TrashIcon width={56} height={56} />
                                    </div>
                                </div>
                                <p className="text-center text-color-primary-text text-xl font-bold max-[768px]:text-lg">
                                    {__(
                                        'Are you sure you want to delete this booking?',
                                        'doublescale'
                                    )}
                                </p>
                                <p className="text-center text-[#71717A] font-normal max-[768px]:text-sm">
                                    {__(
                                        "by Delete this booking you won't be able to restore it again!",
                                        'doublescale'
                                    )}
                                </p>
                            </div>}</DialogTitle></DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteModalVisible(false);
                            }}
                            size='lg'
                        >
                            {__('Back', 'doublescale')}
                        </Button>
                        <Button
                            disabled={loading}
							variant="destructive"
                            className='bg-[#EF4444] text-white'
                            onClick={() => {
                                deleteBooking();
                                setDeleteModalVisible(false);
                            }}
                            size='lg'
                        >
                            {__('Yes, Delete', 'doublescale')}
                        </Button>
                    </div>
                </DialogContent></Dialog>
        </>
    );
};

export default BookingActions;
