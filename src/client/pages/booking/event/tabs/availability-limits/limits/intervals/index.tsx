import { __ } from '@wordpress/i18n';
import { LimitBaseProps } from '@/types/booking';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeSlotIntervalsProps extends LimitBaseProps { }

const timeOptions = [
	{ value: 0, label: __('No buffer time', 'doublescale') },
	...Array.from({ length: 24 }, (_, i) => {
		const value = (i + 1) * 5;
		return { value, label: `${value} ${__('minutes', 'doublescale')}` };
	}),
];

const TimeSlotIntervals: React.FC<TimeSlotIntervalsProps> = ({
	limits,
	handleChange,
}) => {
	return (
        <div className='flex gap-2.5 flex-col mt-4'>
            <div className="text-[#09090B] text-[16px]">
				{__('Time Slot Intervals', 'doublescale')}
				<span className="text-red-500">*</span>
			</div>
            <Select
                value={limits.general.time_slot}
                onValueChange={(value) =>
					handleChange('general', 'time_slot', value)
				} />
        </div>
    );
};

export default TimeSlotIntervals;
