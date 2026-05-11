import { __ } from '@wordpress/i18n';
import { PiClockClockwiseFill } from 'react-icons/pi';
import React, { useEffect, useState } from 'react';
import { CardHeader } from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	MultiSelect,
	type MultiSelectOption,
} from '@/components/ui/multi-select';
import { cn } from '@/lib/utils';

interface DurationProps {
	duration: number;
	onChange: (key: string, value: any) => void;
	handleAdditionalSettingsChange: (key: string, value: any) => void;
	getDefaultDurationOptions: () => { value: number; label: string }[];
	selectable_durations: number[];
	default_duration: number;
	allow_attendees_to_select_duration: boolean;
	disabled?: boolean;
}

const Duration: React.FC<DurationProps> = ({
	duration,
	onChange,
	handleAdditionalSettingsChange,
	getDefaultDurationOptions,
	selectable_durations = [],
	default_duration,
	allow_attendees_to_select_duration,
}) => {
	const durations = [
		{
			value: 15,
			label: __('15 Minutes', 'doublescale'),
			description: __('Quick Check-in', 'doublescale'),
		},
		{
			value: 30,
			label: __('30 Minutes', 'doublescale'),
			description: __('Standard Consultation', 'doublescale'),
		},
		{
			value: 60,
			label: __('60 Minutes', 'doublescale'),
			description: __('In-depth discussion', 'doublescale'),
		},
	];

	const [selectedDuration, setSelectedDuration] = useState<number>(
		() => durations.find((d) => d.value === duration)?.value || durations[0].value
	);

	// Sync effect for single duration mode
	useEffect(() => {
		setSelectedDuration(duration);
	}, [duration]);

	// Effect to keep default_duration in sync with selectable_durations
	useEffect(() => {
		if (!allow_attendees_to_select_duration) return;

		// If there are no selectable durations, clear the default
		if (selectable_durations.length === 0) {
			if (default_duration !== undefined) {
				handleAdditionalSettingsChange('default_duration', undefined);
			}
			return;
		}

		// If current default isn't in selectable durations, set to first available
		if (default_duration && !selectable_durations.includes(default_duration)) {
			handleAdditionalSettingsChange('default_duration', selectable_durations[0]);
		}
		// If there's no default but there are selectable durations, set to first
		else if (!default_duration && selectable_durations.length > 0) {
			handleAdditionalSettingsChange('default_duration', selectable_durations[0]);
		}
	}, [selectable_durations, default_duration, allow_attendees_to_select_duration]);

	const handleSelect = (value: number) => {
		setSelectedDuration(value);
		onChange('duration', value);
	};

	const durationOptions: MultiSelectOption[] = Array.from(
		{ length: 96 },
		(_, i) => ({
			value: String((i + 1) * 5),
			label: `${(i + 1) * 5} minutes`,
		})
	);

	const selectedDurationOptions: MultiSelectOption[] = selectable_durations
		.map((value) =>
			durationOptions.find((option) => option.value === String(value))
		)
		.filter((option): option is MultiSelectOption => Boolean(option));

	const onSelectableDurationsChange = (selected: MultiSelectOption[]) => {
		const values = selected.map((option) => Number(option.value));
		handleAdditionalSettingsChange('selectable_durations', values);
	};

	// Filter options for default duration dropdown
	const filteredDefaultOptions = getDefaultDurationOptions().filter(
		(option) => selectable_durations.includes(option.value)
	);

	return (
        <Card className="rounded-lg"><CardContent>
                <CardHeader
                    title={__('Set Duration', 'doublescale')}
                    description={__(
                        'Define how long your event will be. it can be as long as 12 hours.',
                        'doublescale'
                    )}
                    icon={<PiClockClockwiseFill className="text-[28px]" />}
                />
                <div className='flex items-center mt-4 justify-between'>
                    <div className='flex flex-col gap-[1px]'>
                        <div className="text-[#09090B] text-[16px] font-semibold">
                            {__('Allow attendee to select duration', 'doublescale')}
                        </div>
                        <div className="text-[#71717A]">
                            {__(
                                'By selecting this option, you can set more than one duration for the attendee.',
                                'doublescale'
                            )}
                        </div>
                    </div>
                    <Switch
                        checked={allow_attendees_to_select_duration}
                        onCheckedChange={(checked) => {
                            handleAdditionalSettingsChange(
                                'allow_attendees_to_select_duration',
                                checked
                            );
                        }}
                        className={
                            allow_attendees_to_select_duration
                                ? 'bg-primary'
                                : 'bg-gray-400'
                        }
                    />
                </div>
                <div className='flex flex-col gap-5 mt-4'>
                    {allow_attendees_to_select_duration ? (
                        <>
                            <div className='flex flex-col gap-2'>
                                <div className="text-[#09090B] text-[16px]">
                                    {__('Available Durations', 'doublescale')}
                                    <span className="text-red-500">*</span>
                                </div>
                                <MultiSelect
                                    options={durationOptions}
                                    selected={selectedDurationOptions}
                                    onChange={onSelectableDurationsChange}
                                    placeholder={__('Select durations', 'doublescale')}
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <div className="text-[#09090B] text-[16px]">
                                    {__('Default Duration', 'doublescale')}
                                    <span className="text-red-500">*</span>
                                </div>
                                <Select
                                    value={
                                        default_duration !== undefined
                                            ? String(default_duration)
                                            : undefined
                                    }
                                    onValueChange={(value) => {
                                        handleAdditionalSettingsChange(
                                            'default_duration',
                                            Number(value)
                                        );
                                    }}
                                    disabled={selectable_durations.length === 0}
                                >
                                    <SelectTrigger className="rounded-lg h-[48px]">
                                        <SelectValue
                                            placeholder={__(
                                                'Select default duration',
                                                'doublescale'
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredDefaultOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={String(option.value)}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className='flex flex-col gap-2 mt-4'>
                                <div className="text-[#09090B] text-[16px]">
                                    {__('Meeting Duration', 'doublescale')}
                                    <span className="text-red-500">*</span>
                                </div>
                                <div className='flex gap-5 flex-wrap'>
                                    {durations.map((item) => (
                                        <Card
                                            key={item.value}
                                            className={cn(
                                                'cursor-pointer transition-all rounded-lg w-[190px]',
                                                selectedDuration === item.value
                                                    ? 'border-primary bg-[#E8E2FB]'
                                                    : 'border-[#f0f0f0]'
                                            )}
                                            onClick={() =>
                                                handleSelect(item.value)
                                            }
                                        >
                                            <CardContent className="pt-[18px]">
                                                <div
                                                    className={cn(
                                                        'font-semibold',
                                                        selectedDuration ===
                                                            item.value
                                                            ? 'text-primary'
                                                            : 'text-[#1E2125]'
                                                    )}
                                                >
                                                    {item.label}
                                                </div>
                                                <div className="text-[#1E2125] mt-[6px]">
                                                    {item.description}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            <div className='flex gap-5 items-center'>
                                <div className="text-[#09090B] text-[16px]">
                                    {__('Custom Duration', 'doublescale')}
                                </div>
                                <div className="flex items-center h-[48px] w-[194px] rounded-lg border border-input bg-background pr-3 focus-within:ring-2 focus-within:ring-ring">
                                    <Input
                                        type="number"
                                        className="h-full !border-0 !rounded-l-lg !rounded-r-none outline-none shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
                                        value={duration}
                                        onChange={(e) =>
                                            onChange(
                                                'duration',
                                                Number(e.target.value)
                                            )
                                        }
                                    />
                                    <span className="pl-3 text-[#71717A]">
                                        {__('Min', 'doublescale')}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </CardContent></Card>
    );
};

export default Duration;