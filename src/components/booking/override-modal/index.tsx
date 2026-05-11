/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';

/**
 * Internal dependencies
 */
import type { TimeSlot } from '@/types/booking';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

interface OverrideModalProps {
	isVisible: boolean;
	onClose: () => void;
	onApply: () => void;
	selectedDate: string | null;
	overrideTimes: TimeSlot[];
	isUnavailable: boolean;
	onDateChange: (date: string | null) => void;
	onAddTimeSlot: () => void;
	onRemoveTimeSlot: (index: number) => void;
	onUpdateTimeSlot: (
		index: number,
		field: 'start' | 'end',
		value: string
	) => void;
	onToggleUnavailable: () => void;
	timeFormat: string;
}

const OverrideModal: React.FC<OverrideModalProps> = ({
	isVisible,
	onClose,
	onApply,
	selectedDate,
	overrideTimes,
	isUnavailable,
	onDateChange,
	onAddTimeSlot,
	onRemoveTimeSlot,
	onUpdateTimeSlot,
	onToggleUnavailable,
	timeFormat,
}) => {
	return (
        <Dialog
            open={isVisible}
            onOpenChange={open => {
                if (!open)
                    onClose();
            }}><DialogContent><DialogHeader><DialogTitle>{__('Add Date Override', 'doublescale')}</DialogTitle></DialogHeader>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col gap-2.5'>
                            <span>{__('Select a Date', 'doublescale')}</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant='outline' className='justify-start font-normal'>
                                        <CalendarIcon className='mr-2 h-4 w-4' />
                                        {selectedDate
                                            ? format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'PPP')
                                            : __('Pick a date', 'doublescale')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className='w-auto p-0' align='start'>
                                    <Calendar
                                        mode='single'
                                        selected={selectedDate ? parse(selectedDate, 'yyyy-MM-dd', new Date()) : undefined}
                                        onSelect={(d) =>
                                            onDateChange(d ? format(d, 'yyyy-MM-dd') : null)
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className='flex flex-col gap-2.5'>
                            <span>
                                {__('What hours are you available?', 'doublescale')}
                            </span>
                            {overrideTimes.map((time, index) => (
                                <div key={index} className='flex items-center gap-2.5'>
                                    <Input
                                        type='time'
                                        value={time.start}
                                        onChange={(e) =>
                                            onUpdateTimeSlot(
                                                index,
                                                'start',
                                                e.target.value || '09:00'
                                            )
                                        }
                                        className='w-32'
                                    />
                                    <span>-</span>
                                    <Input
                                        type='time'
                                        value={time.end}
                                        onChange={(e) =>
                                            onUpdateTimeSlot(
                                                index,
                                                'end',
                                                e.target.value || '17:00'
                                            )
                                        }
                                        className='w-32'
                                    />
                                    <Button
                                        onClick={() => onRemoveTimeSlot(index)}
                                        variant='destructive'
                                    >
                                        {__('Remove', 'doublescale')}
                                    </Button>
                                </div>
                            ))}
                            <Button onClick={onAddTimeSlot} variant='outline' className='border-dashed'>
                                {__('Add Time Slot', 'doublescale')}
                            </Button>
                        </div>

                        <div className='flex items-center gap-2.5'>
                            <Checkbox
                                checked={isUnavailable}
                                onCheckedChange={onToggleUnavailable}
                            />
                            <span>{__('Mark as Unavailable', 'doublescale')}</span>
                        </div>
                    </div>
                    <DialogFooter className="mt-5">
                        <Button variant="outline" onClick={onClose}>
                            {__('Cancel', 'doublescale')}
                        </Button>
                        <Button
                            onClick={onApply}
                            disabled={!selectedDate}
                            className="bg-primary text-white"
                        >
                            {__('Apply Override', 'doublescale')}
                        </Button>
                    </DialogFooter>
                </DialogContent></Dialog>
    );
};

export default OverrideModal;
