/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useApi } from '@/hooks/booking';
import {
	CardHeader,
	EventSelect,
	UpcomingCalendarOutlinedIcon,
} from '@/components/booking';
import type { Calendar } from '@/types/booking';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
} from '@/components/ui/dialog';

interface CloneEventModalProps {
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
	calendar: Calendar;
	excludedEvents: number[];
	setCloneMessage: (message: boolean) => void;
	setErrorMessage?: (message: string | null) => void;
}

/**
 * Calendar Events Component.
 */
const CloneEventModal: React.FC<CloneEventModalProps> = ({
	open,
	onClose,
	calendar,
	excludedEvents,
	onSaved,
	setCloneMessage,
	setErrorMessage,
}) => {
	const { callApi, loading } = useApi();
	const [event, setEvent] = useState<number | null>(null);

	const saveCalendar = async () => {
		if (!validate() || loading) return;

		try {
			callApi({
				path: `calendars/${calendar.id}/clone`,
				method: 'POST',
				data: {
					event_id: event,
				},
				onSuccess: () => {
					closeHandler();
					onSaved();
					setCloneMessage(true);
				},
				onError: (error) => {
					if (setErrorMessage) {
						setErrorMessage(error || 'API error');
					}
				},
			});
		} catch (error: any) {
			if (setErrorMessage) {
				setErrorMessage(error.message || 'Unexpected error occurred');
			}
		}
	};

	const validate = () => {
		if (!event) {
			if (setErrorMessage) {
				setErrorMessage(
					__('Please select an event to clone.', 'doublescale')
				);
			}
			return false;
		}
		return true;
	};

	const closeHandler = () => {
		onClose();
		setEvent(null);
	};

	return (
        <Dialog
            open={open}
            onOpenChange={open => {
                if (!open)
                    closeHandler();
            }}><DialogContent>
                <CardHeader
                    title={__('Clone Calendar Event', 'doublescale')}
                    description={__(
                        'Select Calendar to make an exact copy of Calendar Event.',
                        'doublescale'
                    )}
                    icon={<UpcomingCalendarOutlinedIcon />}
                    border={false}
                />
                <div className='flex flex-col'>
                    <div className="text-[#09090B] text-[16px]">
                        {__('Select Calendar Event', 'doublescale')}
                        <span className="text-red-500">*</span>
                    </div>
                    <EventSelect
                        value={event || 0}
                        onChange={setEvent}
                        exclude={excludedEvents}
                        placeholder={__('Select Event', 'doublescale')}
                        type={calendar.type}
                    />
                </div>
                <DialogFooter className="mt-5">
                    <Button
                        variant="outline"
                        onClick={closeHandler}
                        disabled={loading}
                    >
                        {__('Cancel', 'doublescale')}
                    </Button>
                    <Button
                        onClick={saveCalendar}
                        disabled={loading || !event}
                        className="bg-primary text-white"
                    >
                        {loading
                            ? __('Cloning...', 'doublescale')
                            : __('Clone Event', 'doublescale')}
                    </Button>
                </DialogFooter>
            </DialogContent></Dialog>
    );
};

export default CloneEventModal;
