import { __ } from '@wordpress/i18n';

import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface ScheduleComponentProps {
	availability: {
		weekly_hours: {
			[key: string]: {
				off: boolean;
				times: { start: string; end: string }[];
			};
		};
	};
	onCustomAvailabilityChange: (
		dayKey: string,
		field: string,
		value: boolean | { start: string; end: string }[]
	) => void;
	startDay: string;
	timeFormat: string;
}

const ScheduleComponent: React.FC<ScheduleComponentProps> = ({
	availability,
	startDay,
	timeFormat,
	onCustomAvailabilityChange,
}) => {
	const weekOrder = [
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
		'sunday',
	];

	// Function to reorder days based on startDay. Guards against an
	// undefined `availability.weekly_hours` so a partially-loaded event
	// (e.g. just before `setEvent` resolves) doesn't crash the whole tab.
	const getReorderedDays = () => {
		const weeklyHours = availability?.weekly_hours || {};
		const startIndex = weekOrder.indexOf(
			(startDay || '').toLowerCase()
		);
		if (startIndex === -1) {
			return Object.keys(weeklyHours);
		}

		const reorderedWeek = [
			...weekOrder.slice(startIndex),
			...weekOrder.slice(0, startIndex),
		];

		return reorderedWeek.filter((day) => weeklyHours[day]);
	};

	// Helper function to validate and swap times if needed
	const validateAndSwapTimes = (startTime: string, endTime: string) => {
		// String comparison works for HH:mm format (zero-padded)
		if (startTime > endTime) {
			return {
				start: endTime,
				end: startTime,
			};
		}

		return {
			start: startTime,
			end: endTime,
		};
	};

	const orderedDays = getReorderedDays();

	const DEFAULT_SLOT = { start: '09:00', end: '17:00' };

	return (
        <>
            {orderedDays.map((key) => {
				const day = availability.weekly_hours[key];
				if (!day) return null;
				// `times` is sometimes returned as `null` or `[]` from the API
				// when a day has never been edited. Fall back to a single
				// 9–5 slot so the time inputs stay controlled and reading
				// `times[0].start` doesn't blow up.
				const slot =
					Array.isArray(day.times) && day.times[0]
						? day.times[0]
						: DEFAULT_SLOT;
				return (
                    <div key={key} className='flex items-center gap-[15px] mb-5'>
                        <div className='flex gap-2.5 items-center w-[145px]'>
							<Switch
								checked={!day.off}
								onCheckedChange={(checked) =>
									onCustomAvailabilityChange(
										key,
										'off',
										!checked
									)
								}
								className={`${!day.off ? 'bg-primary' : 'bg-gray-400'}`}
							/>
							<span className="capitalize text-[#1E2125] text-[16px] font-[700] flex-1">
								{key}
							</span>
						</div>
                        <div className="flex items-center gap-2 h-[48px] rounded-lg flex-1 border border-input px-3 custom-timepicker">
							<span className="text-[#9BA7B7]">
								{__('From', 'doublescale')}
							</span>
							<Input
								type="time"
								value={slot.start}
								onChange={(e) => {
									const newStartTime = e.target.value;
									if (!newStartTime) return;
									const validatedTimes = validateAndSwapTimes(
										newStartTime,
										slot.end
									);
									onCustomAvailabilityChange(key, 'times', [
										{
											start: validatedTimes.start,
											end: validatedTimes.end,
										},
									]);
								}}
								disabled={day.off}
								className="!border-none shadow-none focus-visible:!ring-0 px-0"
							/>
						</div>
                        <div className="flex items-center gap-2 h-[48px] rounded-lg flex-1 border border-input px-3 custom-timepicker">
							<span className="text-[#9BA7B7]">
								{__('To', 'doublescale')}
							</span>
							<Input
								type="time"
								value={slot.end}
								onChange={(e) => {
									const newEndTime = e.target.value;
									if (!newEndTime) return;
									const validatedTimes = validateAndSwapTimes(
										slot.start,
										newEndTime
									);
									onCustomAvailabilityChange(key, 'times', [
										{
											start: validatedTimes.start,
											end: validatedTimes.end,
										},
									]);
								}}
								disabled={day.off}
								className="!border-none shadow-none focus-visible:!ring-0 px-0"
							/>
						</div>
                    </div>
                );
			})}
        </>
    );
};

export default ScheduleComponent;
