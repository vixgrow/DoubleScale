/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Availability, Host } from '@/types/booking';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SelectScheduleProps {
	availability: Availability;
	hosts: Host[];
	onAvailabilityChange: (id: number) => void;
	title: string;
}
const SelectSchedule: React.FC<SelectScheduleProps> = ({
	availability,
	hosts,
	onAvailabilityChange,
	title,
}) => {
	// Each host owns its own list of saved availabilities; flatten across
	// hosts so the dropdown can show every option this event could pick.
	const options = (hosts || []).flatMap((host) =>
		(host.availabilities || []).map((a) => ({
			id: a.id,
			label: `${host.name} — ${a.name}`,
		}))
	);

	return (
        <div className='flex gap-[1px] flex-col mt-5'>
            <span className="text-[#09090B] text-[16px] font-semibold">
				{title}
				<span className="text-red-500">*</span>
			</span>
            <Select
                value={availability?.id ? String(availability.id) : ''}
                onValueChange={(value) =>
                    onAvailabilityChange(Number(value))
                }
            >
                <SelectTrigger className="h-[48px] rounded-lg">
                    <SelectValue
                        placeholder={__(
                            'Select an existing schedule',
                            'doublescale'
                        )}
                    />
                </SelectTrigger>
                <SelectContent>
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-[#71717A]">
                            {__(
                                'No saved availabilities for this event yet.',
                                'doublescale'
                            )}
                        </div>
                    ) : (
                        options.map((opt) => (
                            <SelectItem
                                key={opt.id}
                                value={String(opt.id)}
                            >
                                {opt.label}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        </div>
    );
};

export default SelectSchedule;
