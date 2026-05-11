/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	CurrentTimeInTimezone,
	TimezoneSelect,
} from '@/components/booking';

interface SelectTimezoneProps {
	timezone: string;
	handleChange: (value: string) => void;
	timeFormat?: string;
}
const SelectTimezone: React.FC<SelectTimezoneProps> = ({
	timezone,
	handleChange,
	timeFormat = '12',
}) => {
	return (
        <div className='flex flex-col gap-2.5 px-[20px]'>
            <div className="text-[#09090B] text-[16px]">
				{__('Select Time Zone', 'doublescale')}
				<span className="text-red-500">*</span>
			</div>
            <TimezoneSelect
				value={timezone}
				onChange={(value) => handleChange(value)}
				className="h-[48px] w-full rounded-lg"
			/>
            <CurrentTimeInTimezone
				className="text-[#71717A]"
				currentTimezone={timezone}
				timeFormat={timeFormat}
			/>
        </div>
    );
};

export default SelectTimezone;
