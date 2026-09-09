/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AvailabilitySection from './availability';
import EventLimits from './limits';
import {
	AvailabilityRange,
	DateOverrides,
	EventTabHandle,
	EventTabProps,
	UnitOptions as UnitOptionsType,
	EventLimits as EventLimitsType,
	LimitUnit,
	Availability,
	EventAvailabilityMeta,
	Host,
} from '@/types/booking';
import { useApi, useEvent } from '@/hooks/booking';
import Shimmer from './shimmer';

const resolveScheduleId = (
	hostsSchedules: Record<string, number> | undefined,
	hostId: number
): number | undefined => {
	if (!hostsSchedules) {
		return undefined;
	}
	const scheduleId =
		hostsSchedules[hostId] ?? hostsSchedules[String(hostId)];
	return scheduleId != null ? Number(scheduleId) : undefined;
};

const resolveHostAvailability = (
	host: Host,
	hostsSchedules: Record<string, number> | undefined
): Availability | null => {
	const scheduleId = resolveScheduleId(hostsSchedules, host.id);
	if (scheduleId != null) {
		const matched = host.availabilities?.find(
			(item) => Number(item.id) === scheduleId
		);
		if (matched) {
			return matched;
		}
	}

	return (
		host.availabilities?.find((item) => item.is_default) ??
		host.availabilities?.[0] ??
		null
	);
};

const AvailabilityLimits = forwardRef<EventTabHandle, EventTabProps>(
	(props, ref) => {
		// Event state
		const [availabilityType, setAvailabilityType] = useState<
			'existing' | 'custom'
		>('existing');
		const [availability, setAvailability] = useState<Availability | null>(
			null
		);
		const [availabilityMeta, setAvailabilityMeta] =
			useState<EventAvailabilityMeta | null>(null);
		const [eventAvailability, setEventAvailability] =
			useState<Availability | null>(null);
		const [reservetimes, setReservetimes] = useState<boolean>(false);
		const [range, setRange] = useState<AvailabilityRange>({
			type: 'days',
			days: 5,
		});
		const [override, setDateOverrides] = useState<DateOverrides>({});
		const [teamAvailability, setTeamAvailability] = useState<
			Record<string, Availability | null>
		>({});
		const [selectedUser, setSelectedUser] = useState<Host | null>(null);
		const [hydratedEventId, setHydratedEventId] = useState<number | null>(
			null
		);
		// Global settings state
		const [startDay, setStartDay] = useState<string>('monday');
		const [timeFormat, setTimeFormat] = useState<string>('12');

		// Limits state
		const [bookingDurationOptions, setBookingDurationOptions] =
			useState<UnitOptionsType>({
				days: { label: __('Day', 'doublescale'), disabled: false },
				weeks: { label: __('Week', 'doublescale'), disabled: false },
				months: { label: __('Month', 'doublescale'), disabled: false },
			});
		const [bookingFrequencyOptions, setBookingFrequencyOptions] =
			useState<UnitOptionsType>({
				days: { label: __('Day', 'doublescale'), disabled: false },
				weeks: { label: __('Week', 'doublescale'), disabled: false },
				months: { label: __('Month', 'doublescale'), disabled: false },
			});
		const [limits, setLimits] = useState<EventLimitsType | null>(null);

		const { currentEvent: event, loading: eventLoading } = useEvent();
		const { callApi, loading } = useApi();

		const fetchRange = () => {
			if (!event) return;

			callApi({
				path: `events/${event.id}/range`,
				method: 'GET',
				onSuccess(response: { range: AvailabilityRange }) {
					setRange(response.range);
				},
				onError(error) {
					console.error('Error fetching range:', error);
				},
			});
		};

		const fetchLimits = () => {
			if (!event) return;

			callApi({
				path: `events/${event.id}/meta/limits`,
				method: 'GET',
				onSuccess(response: EventLimitsType) {
					setLimits(response);
					setBookingDurationOptions((prev) => {
						const updatedOptions = { ...prev };
						response.duration.limits.forEach((limit) => {
							if (updatedOptions[limit.unit as LimitUnit]) {
								updatedOptions[
									limit.unit as LimitUnit
								].disabled = true;
							}
						});
						return updatedOptions;
					});

					setBookingFrequencyOptions((prev) => {
						const updatedOptions = { ...prev };
						response.frequency.limits.forEach((limit) => {
							if (updatedOptions[limit.unit as LimitUnit]) {
								updatedOptions[
									limit.unit as LimitUnit
								].disabled = true;
							}
						});
						return updatedOptions;
					});
				},
				onError(error) {
					throw new Error(error.message);
				},
			});
		};

		const fetchGlobalSettings = () => {
			callApi({
				path: 'settings',
				method: 'GET',
				onSuccess: (data) => {
					setStartDay(data.general?.start_from || 'monday');
					setTimeFormat(data.general?.time_format || '12');
				},
				onError: (error) => {
					console.error('Error fetching start day:', error);
				},
			});
		};

		useEffect(() => {
			if (!event) {
				return;
			}
			fetchLimits();
			fetchRange();
			fetchGlobalSettings();
			if (event.availability_type === 'existing') {
				setAvailability(event.availability || null);
				setDateOverrides(event.availability?.value.override || {});
			}
			if (event.availability_type === 'custom') {
				setAvailability(
					event.availability_meta?.custom_availability || null
				);
				setDateOverrides(
					event.availability_meta?.custom_availability?.value
						.override || {}
				);
			}

			if (event.calendar.type === 'team') {
				const hostsSchedules =
					event.availability_meta?.hosts_schedules;
				const availabilityObj: Record<string, Availability | null> =
					event.hosts?.reduce(
						(
							acc: Record<string, Availability | null>,
							host: Host
						) => {
							acc[host.id] = resolveHostAvailability(
								host,
								hostsSchedules
							);
							return acc;
						},
						{} as Record<string, Availability | null>
					) || {};

				setTeamAvailability(availabilityObj);
				const firstHost = event.hosts?.[0];
				if (firstHost && event.availability_meta?.is_common !== true) {
					const firstHostAvailability =
						availabilityObj[firstHost.id] ?? null;
					setAvailability(firstHostAvailability);
					setDateOverrides(
						firstHostAvailability?.value?.override || {}
					);
				}
			}
			setSelectedUser(event.hosts?.[0] || null);
			setEventAvailability(event.availability || null);
			setAvailabilityMeta(event.availability_meta || null);
			setAvailabilityType(event.availability_type);
			setReservetimes(event.reserve_times ?? false);
			setHydratedEventId(event.id);
		}, [event]);

		useImperativeHandle(ref, () => ({
			saveSettings: async () => {
				if (event) {
					return saveEventDetails();
				}
				return Promise.resolve();
			},
		}));
		const saveEventDetails = async () => {
			try {
				await callApi({
					path: `events/${event?.id}`,
					method: 'PUT',
					data: {
						event_availability: eventAvailability,
						event_availability_meta: availabilityMeta,
						availability_type: availabilityType,
						team_availability: teamAvailability,
						limits,
						event_range: range,
						reserve_times: reservetimes,
					},
					onSuccess() {
						props.setDisabled(true);
					},
					onError(error) {
						// Re-throw the error to be caught by the outer try-catch
						throw new Error(error.message);
					},
				});
			} catch (error: any) {
				// Re-throw the error if you want calling code to handle it
				throw new Error(error.message);
			}
		};

		if (
			!limits ||
			loading ||
			eventLoading ||
			!event ||
			hydratedEventId !== event.id
		) {
			return <Shimmer />;
		}

		return (
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-5 ">
				<AvailabilitySection
					event={event}
					eventAvailability={eventAvailability}
					availability={availability}
					availabilityMeta={availabilityMeta}
					availabilityType={availabilityType}
					setAvailability={setAvailability}
					setEventAvailability={setEventAvailability}
					setAvailabilityMeta={setAvailabilityMeta}
					setAvailabilityType={setAvailabilityType}
					setReservetimes={setReservetimes}
					reservetimes={reservetimes}
					setDisabled={props.setDisabled}
					setRange={setRange}
					range={range}
					dateOverrides={override}
					setDateOverrides={setDateOverrides}
					timeFormat={timeFormat}
					startDay={startDay}
					teamAvailability={teamAvailability}
					setTeamAvailability={setTeamAvailability}
					selectedUser={selectedUser}
					setSelectedUser={setSelectedUser}
				/>
				<EventLimits
					bookingDurationOptions={bookingDurationOptions}
					bookingFrequencyOptions={bookingFrequencyOptions}
					setBookingDurationOptions={setBookingDurationOptions}
					setBookingFrequencyOptions={setBookingFrequencyOptions}
					setLimits={setLimits}
					limits={limits}
					setDisabled={props.setDisabled}
					timeFormat={timeFormat}
				/>
			</div>
		);
	}
);

export default AvailabilityLimits;
