/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { RadioGroup } from '@/components/ui/radio-group';
import { RadioCard } from '@/components/booking';

interface AvailabilityTypeProps {
	availabilityType: 'existing' | 'custom';
	handleAvailabilityTypeChange: (value: 'existing' | 'custom') => void;
}

const AvailabilityType: React.FC<AvailabilityTypeProps> = ({
	availabilityType,
	handleAvailabilityTypeChange,
}) => {
	return (
		<div className='flex flex-col gap-1 mt-4'>
			<span className="text-[#09090B] text-[16px] font-semibold">
				{__(
					'How do you want to offer your availability for this event type?',
					'doublescale'
				)}
				<span className="text-red-500">*</span>
			</span>
			<RadioGroup
				value={availabilityType}
				onValueChange={(value) => {
					handleAvailabilityTypeChange(
						value as 'existing' | 'custom'
					);
				}}
				className="grid grid-cols-1 sm:grid-cols-2 gap-2"
			>
				<RadioCard
					value="existing"
					checked={availabilityType === 'existing'}
					className="flex-1 border rounded-lg py-4 px-3 text-[#3F4254] font-semibold"
				>
					{__('Use an Existing Schedule', 'doublescale')}
				</RadioCard>
				<RadioCard
					value="custom"
					checked={availabilityType === 'custom'}
					className="flex-1 border rounded-lg py-4 px-3 text-[#3F4254] font-semibold"
				>
					{__('Set Custom Hours', 'doublescale')}
				</RadioCard>
			</RadioGroup>
		</div>
	);
};

export default AvailabilityType;
