import { __ } from '@wordpress/i18n';
import { isEmpty } from 'lodash';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import type { DateOverrides, TimeSlot } from '@/types/booking';
import { LimitsAddIcon, TrashIcon } from '@/components/booking';
import './style.scss';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

interface OverrideSectionProps {
	dateOverrides: DateOverrides;
	setDateOverrides: (overrides: DateOverrides) => void;
	setDisabled: (value: boolean) => void;
	updatedAvailabilities?: (newOverrides: DateOverrides) => void;
	timeFormat: string;
}

const OverrideSection: React.FC<OverrideSectionProps> = ({
	dateOverrides,
	setDateOverrides,
	setDisabled,
	updatedAvailabilities,
	timeFormat,
}) => {
	const onAddOverride = () => {
		setDisabled(false);
		const newOverrides: DateOverrides = {
			...dateOverrides,
			'': [
				...(dateOverrides[''] || []),
				{ start: '09:00', end: '17:00' } as TimeSlot,
			],
		};
		setDateOverrides(newOverrides);
		updatedAvailabilities?.(newOverrides);
	};
	const onRemoveOverride = (date: string, idx: number) => {
		setDisabled(false);
		const times = [...(dateOverrides[date] || [])];
		times.splice(idx, 1);
		const newOverrides: DateOverrides = { ...dateOverrides };

		if (times.length) {
			newOverrides[date] = times;
		} else {
			delete newOverrides[date];
		}

		setDateOverrides(newOverrides);
		updatedAvailabilities?.(newOverrides);
	};

	const onDateChange = (
		newDate: string | null,
		oldDate: string,
		idx: number
	) => {
		setDisabled(false);
		const oldTimes = [...(dateOverrides[oldDate] || [])];
		const [moved] = oldTimes.splice(idx, 1);

		const updated: DateOverrides = { ...dateOverrides };
		if (oldTimes.length) {
			updated[oldDate] = oldTimes;
		} else {
			delete updated[oldDate];
		}

		const key = newDate || '';
		updated[key] = [...(updated[key] || []), moved];
		setDateOverrides(updated);
		updatedAvailabilities?.(updated);
	};

	// Updated function to handle both start and end time changes
	const onUpdateTimeRange = (
		date: string,
		idx: number,
		start: string,
		end: string
	) => {
		setDisabled(false);
		const times = [...(dateOverrides[date] || [])];
		times[idx] = { ...times[idx], start, end };
		setDateOverrides({ ...dateOverrides, [date]: times });
		updatedAvailabilities?.({ ...dateOverrides, [date]: times });
	};

	const entries = Object.entries(dateOverrides).flatMap(([date, times]) =>
		times.map((time, index) => ({ date, time, index }))
	);

	return (
        <Card className="w-full"><CardContent>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col'>
                            <span className="text-[#09090B] font-bold text-[20px]">
                                {__('Date-specific hours', 'doublescale')}
                            </span>
                            <span className="text-[#71717A] text-[12px]">
                                {__(
                                    'Override your availability for specific dates when your hours differ from your regular weekly hours.',
                                    'doublescale'
                                )}
                            </span>
                        </div>

                        {isEmpty(entries) && (
                            <Button
                                onClick={onAddOverride}
                                className="border-none bg-primary text-white w-fit rounded-lg"
                            >
                                {__('Add an override', 'doublescale')}
                            </Button>
                        )}

                        <div className='flex flex-col gap-5'>
                            {entries.map(({ date, time, index }, key) => (
                                <div key={`${date}-${index}-${key}`} className='flex items-center gap-2.5'>
                                    <div
                                        className='flex items-center gap-2.5 border border-[#E4E7EC] p-2 rounded-lg flex-1'>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant='ghost'
                                                    className='justify-start font-normal flex-1 px-2'
                                                >
                                                    <CalendarIcon className='mr-2 h-4 w-4' />
                                                    {date
                                                        ? format(parse(date, 'yyyy-MM-dd', new Date()), 'PPP')
                                                        : __('Pick a date', 'doublescale')}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className='w-auto p-0' align='start'>
                                                <Calendar
                                                    mode='single'
                                                    selected={date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined}
                                                    onSelect={(d) =>
                                                        onDateChange(
                                                            d ? format(d, 'yyyy-MM-dd') : null,
                                                            date,
                                                            index
                                                        )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <div className="border-l-2 border-[#E4E7EC] h-5"></div>

                                        <Input
                                            type='time'
                                            value={time.start}
                                            onChange={(e) =>
                                                onUpdateTimeRange(
                                                    date,
                                                    index,
                                                    e.target.value || '',
                                                    time.end
                                                )
                                            }
                                            className='w-28 !border-none shadow-none focus-visible:!ring-0'
                                        />
                                        <span className="text-[#9BA7B7]">-</span>
                                        <Input
                                            type='time'
                                            value={time.end}
                                            onChange={(e) =>
                                                onUpdateTimeRange(
                                                    date,
                                                    index,
                                                    time.start,
                                                    e.target.value || ''
                                                )
                                            }
                                            className='w-28 !border-none shadow-none focus-visible:!ring-0'
                                        />
                                    </div>

                                    <Button
                                        onClick={onAddOverride}
                                        className="border-none shadow-none h-8 w-8 text-white"
                                    >
                                        <LimitsAddIcon />
                                    </Button>

                                    <Button
                                        onClick={() => onRemoveOverride(date, index)}
                                        className="border-none shadow-none p-2 h-8 w-8"
                                        variant='destructive'
                                        size='sm'
                                    >
                                        <TrashIcon width={24} height={24} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent></Card>
    );
};

export default OverrideSection;
