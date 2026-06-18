/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import { CalendarTickIcon, CardHeader } from '@/components/booking';
import { RangeSection } from './sections';
import {
	Availability,
	AvailabilityRange,
	DateOverrides,
	EventAvailabilityMeta,
	Host,
	Event,
} from '@/types/booking';

// Team availability extends the base availability with users_availability
interface TeamAvailability extends Availability {
	users_availability: Record<number, Availability>;
}
import SingleAvailability from './components/single-availability';
import TeamAvailability from './components/team-availability';

import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

const AvailabilitySection: React.FC<{
	event: Event | null;
	availability: Availability | null;
	availabilityMeta: EventAvailabilityMeta | null;
	eventAvailability: Availability | null;
	availabilityType: 'custom' | 'existing';
	setAvailability: (availability: Availability | null) => void;
	setAvailabilityMeta: (availabilityMeta: EventAvailabilityMeta) => void;
	setEventAvailability: (eventAvailability: Availability) => void;
	setAvailabilityType: (availabilityType: 'custom' | 'existing') => void;
	setReservetimes: (reservetimes: boolean) => void;
	setDisabled: (disabled: boolean) => void;
	reservetimes: boolean;
	setRange: (range: AvailabilityRange) => void;
	range: AvailabilityRange;
	dateOverrides: DateOverrides;
	setDateOverrides: (dateOverrides: DateOverrides) => void;
	timeFormat: string;
	startDay: string;
	teamAvailability: Record<string, Availability | null>;
	setTeamAvailability: (
		teamAvailability: Record<string, Availability | null>
	) => void;
	selectedUser: Host | null;
	setSelectedUser: (selectedUser: Host | null) => void;
}> = ({
	event,
	availability,
	availabilityMeta,
	eventAvailability,
	availabilityType,
	setAvailability,
	setAvailabilityMeta,
	setEventAvailability,
	setAvailabilityType,
	setReservetimes,
	setDisabled,
	reservetimes,
	setRange,
	range,
	dateOverrides,
	setDateOverrides,
	timeFormat,
	startDay,
	teamAvailability,
	setTeamAvailability,
	selectedUser,
	setSelectedUser,
}) => {
	const onAvailabilityChange = (id: string) => {
		setDisabled(false);

		// Find the selected availability across all hosts
		const selected = event?.hosts
			?.flatMap((host) => host.availabilities || [])
			?.find(
				(availability: Availability) => availability.id === parseInt(id)
			);

		if (selected) {
			setEventAvailability(selected);
			setAvailability(selected);
			setDateOverrides(selected.value.override || {});
		}
	};

	const onAvailabilityTypeChange = (value: 'custom' | 'existing') => {
		setAvailabilityType(value);
		if (value === 'custom' && availabilityMeta?.custom_availability) {
			setAvailability(availabilityMeta.custom_availability);
			setDateOverrides(
				availabilityMeta.custom_availability.value.override || {}
			);
		}
		if (value === 'existing' && eventAvailability) {
			setAvailability(eventAvailability);
			setDateOverrides(eventAvailability.value.override || {});
		}
		setDisabled(false);
	};

	const onRangeTypeChange = (type: 'days' | 'date_range' | 'infinity') => {
		setDisabled(false);
		setRange({
			type,
			days: type === 'days' ? (range.days ? range.days : 60) : undefined,
			start_date:
				type === 'date_range'
					? range.start_date
						? range.start_date
						: dayjs().format('YYYY-MM-DD')
					: undefined,
			end_date:
				type === 'date_range'
					? range.end_date
						? range.end_date
						: dayjs().add(90, 'days').format('YYYY-MM-DD')
					: undefined,
		});
	};

	const onDaysChange = (days: number) => {
		setDisabled(false);
		setRange({ ...range, days });
	};

	const onDateRangeChange = (start_date: string, end_date: string) => {
		setDisabled(false);
		setRange({ ...range, start_date, end_date });
	};

	const handleToggle = (value: boolean) => {
		setReservetimes(value);
		setDisabled(false);
	};
	return (
        <Card className="rounded-lg"><CardContent>
                <CardHeader
                    title={__('Availability', 'doublescale')}
                    description={__(
                        'Control your availability and work time at different time of days',
                        'doublescale'
                    )}
                    icon={<CalendarTickIcon />}
                />
                {event?.calendar.type === 'team' && (
                    <div className="mt-4 flex flex-col gap-3 max-[768px]:gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1 flex flex-col gap-[1px]">
                            <div className="text-[#09090B] text-[16px] font-semibold">
                                {__('Choose a common schedule', 'doublescale')}
                            </div>
                            <div className="text-[#71717A]">
                                {__(
                                    'Enable this if you want to use a common schedule between hosts. When disabled, each host will be booked based on their default or chosen schedule.',
                                    'doublescale'
                                )}
                            </div>
                        </div>
                        <Switch
                            checked={availabilityMeta?.is_common || false}
                            onCheckedChange={(value: boolean) => {
                                setDisabled(false);
                                if (availabilityMeta) {
                                    setAvailabilityMeta({
                                        ...availabilityMeta,
                                        is_common: value,
                                    });
                                }
                                if (!value && selectedUser?.id) {
                                    const userAvailability =
                                        teamAvailability[selectedUser.id];
                                    setAvailability(userAvailability);
                                    setDateOverrides(
                                        userAvailability?.value.override || {}
                                    );
                                }
                                if (value && eventAvailability) {
                                    setAvailability(eventAvailability);
                                    setDateOverrides(
                                        eventAvailability.value.override || {}
                                    );
                                }
                            }}
                            className={
                                availabilityMeta?.is_common
                                    ? 'bg-primary shrink-0'
                                    : 'bg-gray-400 shrink-0'
                            }
                        />
                    </div>
                )}
                {(event?.calendar.type === 'host' ||
                    (event?.calendar.type === 'team' &&
                        availabilityMeta?.is_common)) && (
                    <SingleAvailability
                        availabilityType={availabilityType}
                        onAvailabilityTypeChange={onAvailabilityTypeChange}
                        availability={availability}
                        hosts={event?.hosts || []}
                        onAvailabilityChange={onAvailabilityChange}
                        timeFormat={timeFormat}
                        startDay={startDay}
                        setDisabled={setDisabled}
                        setAvailability={setAvailability}
                        setAvailabilityMeta={setAvailabilityMeta}
                        setEventAvailability={setEventAvailability}
                        availabilityMeta={availabilityMeta}
                        dateOverrides={dateOverrides}
                        setDateOverrides={setDateOverrides}
                        eventAvailability={eventAvailability}
                    />
                )}
                {event?.calendar.type === 'team' &&
                    !availabilityMeta?.is_common && (
                        <TeamAvailability
                            availability={availability}
                            event={event}
                            timeFormat={timeFormat}
                            startDay={startDay}
                            dateOverrides={dateOverrides}
                            availabilityType={availabilityType}
                            availabilityMeta={availabilityMeta}
                            setAvailabilityMeta={setAvailabilityMeta}
                            setEventAvailability={setEventAvailability}
                            setDisabled={setDisabled}
                            setAvailability={setAvailability}
                            setDateOverrides={setDateOverrides}
                            teamAvailability={teamAvailability}
                            setTeamAvailability={setTeamAvailability}
                            selectedUser={selectedUser}
                            setSelectedUser={setSelectedUser}
                            eventAvailability={eventAvailability}
                        />
                    )}
                <Card className="border-none"><CardContent>
                        <RangeSection
                            range={range}
                            onRangeTypeChange={onRangeTypeChange}
                            onDaysChange={onDaysChange}
                            onDateRangeChange={onDateRangeChange}
                        />
                    </CardContent></Card>
                <Card className="mt-6"><CardContent>
                        <div className="flex flex-col gap-3 max-[768px]:gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1 flex flex-col gap-[1px]">
                                <div className="text-[#09090B] text-[20px] max-[768px]:text-lg">
                                    {__('Reserve Times', 'doublescale')}
                                </div>
                                <div className="text-[#232325] text-[16px] max-[768px]:text-sm">
                                    {__(
                                        'Enable to reserve selected times for this event only. When disabled, times remain available and may disappear if booked by others.',
                                        'doublescale'
                                    )}
                                </div>
                            </div>
                            <Switch
                                checked={reservetimes}
                                onCheckedChange={handleToggle}
                                className={
                                    reservetimes
                                        ? 'bg-primary shrink-0'
                                        : 'bg-gray-400 shrink-0'
                                }
                            />
                        </div>
                    </CardContent></Card>
            </CardContent></Card>
    );
};

export default AvailabilitySection;
