/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import dayjs, { Dayjs } from 'dayjs';

/**
 * Internal dependencies
 */
import {
	AddCalendarOutlinedIcon,
	NoticeBanner,
	TimezoneSelect,
} from '@/components/booking';
import {
	fetchAjax,
	get_location,
	getCurrentTimezone,
	getFields,
} from '@/utils/booking';
import {
	Booking,
	Calendar,
	Event,
	EventAvailability,
	Fields,
} from '@/types/booking';
import { useApi } from '@/hooks/booking';
import { CurrentTimeInTimezone } from '@/components/booking';
import QuestionsComponents from './questions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfiniteScrollSelect } from '@/components/infinite-scroll-select';

interface AddBookingModalProps {
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
	booking?: Booking;
}


const AddBookingModal: React.FC<AddBookingModalProps> = ({
	open,
	onClose,
	onSaved,
	booking,
}) => {
	const [formValues, setFormValues] = useState<Record<string, any>>({
		status: 'scheduled',
	});
	const form = {
		getFieldsValue: () => formValues,
		setFieldsValue: (vals: Record<string, any>) =>
			setFormValues((prev) => ({ ...prev, ...vals })),
		getFieldValue: (key: string) => formValues[key],
		resetFields: (keys?: string[]) =>
			setFormValues((prev) => {
				if (!keys) return {};
				const next = { ...prev };
				keys.forEach((k) => {
					delete next[k];
				});
				return next;
			}),
		validateFields: async () => formValues,
	};
	const [currentTimezone, setCurrentTimezone] = useState<string | null>(
		getCurrentTimezone()
	);
	const [calendars, setCalendars] = useState<Calendar[]>([]);
	const [allTimeSlots, setAllTimeSlots] = useState<string[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [selectedAvailability, setSelectedAvailability] =
		useState<EventAvailability>();
	const [timeOptions, setTimeOptions] = useState<
		{ time: string; slot: any }[]
	>([]);
	const [showAllTimes, setShowAllTimes] = useState<boolean>(false);
	const [ignoreAvailability, setIgnoreAvailability] =
		useState<boolean>(false);
	const [fields, setFields] = useState<Fields>();
	const [isMultipleDuration, setIsMultipleDuration] =
		useState<boolean>(false);
	const [defaultDuration, setDefaultDuration] = useState<number | null>(null);
	const [selectedTimeSlotHostsIds, setSelectedTimeSlotHostsIds] = useState<
		number[]
	>([]);
	const [selectedContact, setSelectedContact] = useState<any | null>(null);
	const [contactMode, setContactMode] = useState<'existing' | 'new'>('existing');

	const { callApi, loading } = useApi();
	const [inlineError, setInlineError] = useState<string | null>(null);

	const reportError = (message: string) => {
		setInlineError(message);
	};

	const fetchCalendar = () => {
		callApi({
			path: 'calendars',
			method: 'GET',
			onSuccess: (res) => {
				setCalendars(res.data || []);
			},
			onError: (error) => {
				reportError(
					error || __('Failed to load calendars.', 'doublescale')
				);
			},
		});
	};

	const handleEventChange = (value: number) => {
		if (!value) {
			return;
		}
		callApi({
			path: `events/${value}`,
			method: 'GET',
			onSuccess: (event: Event) => {
				setSelectedEvent(event);
				form.setFieldsValue({
					location: event.location?.[0]?.type || '',
				});
				form.resetFields(['selectDate', 'selectTime']);
				setTimeOptions([]);
				fetchAvailability(event.id);
				fetchFields(event.id);
				setIsMultipleDuration(
					event.additional_settings.allow_attendees_to_select_duration
				);
				if (
					event.additional_settings.allow_attendees_to_select_duration
				) {
					setDefaultDuration(
						event.additional_settings.default_duration
					);
					form.setFieldsValue({
						duration: event.additional_settings.default_duration,
					});
				} else {
					setDefaultDuration(event.duration);
					form.setFieldsValue({
						duration: event.duration,
					});
				}
			},
			onError: (error) => {
				reportError(
					error || __('Failed to load event details.', 'doublescale')
				);
				setSelectedEvent(null);
				form.resetFields([
					'selectDate',
					'selectTime',
					'duration',
					'location',
				]);
				setTimeOptions([]);
			},
		});
	};

	const fetchFields = (eventId: number) => {
		callApi({
			path: `events/${eventId}/fields`,
			method: 'GET',
			onSuccess: (res) => {
				setFields(res);
			},
			onError: (error) => {
				reportError(
					error ||
						__(
							'Failed to load this event’s booking form fields.',
							'doublescale'
						)
				);
			},
		});
	};

	const fetchAvailability = (value: number, user_id?: number) => {
		const formData = new FormData();
		formData.append('action', 'doublescale_booking_booking_slots');
		formData.append('id', value.toString());
		formData.append('timezone', currentTimezone || '');
		// Backend expects a Y-m-d (or Y-m-d H:i:s) string in site time, not
		// an ISO string with a Z suffix — passing the latter trips the
		// AvailabilityService's date parser and returns 400 Bad Request.
		formData.append('start_date', dayjs().format('YYYY-MM-DD'));
		formData.append('duration', defaultDuration?.toString() || '30');
		formData.append('user_id', user_id?.toString() ?? '');

		fetchAjax('admin-ajax.php', {
			method: 'POST',
			body: formData,
		})
			.then((res) => {
				if (res?.success === false) {
					const message =
						res?.data?.message ||
						__(
							'Could not load available time slots for this event.',
							'doublescale'
						);
					reportError(message);
					setSelectedAvailability(undefined);
					return;
				}
				setInlineError(null);
				setSelectedAvailability(res?.data?.slots);
			})
			.catch((error: any) => {
				const message =
					error?.message ||
					__(
						'Could not load available time slots for this event.',
						'doublescale'
					);
				reportError(message);
				setSelectedAvailability(undefined);
			});
	};

	const isReady = !!selectedEvent;

	const disabledDate = (current: Dayjs): boolean => {
		if (showAllTimes) {
			return false;
		}
		if (!selectedAvailability) {
			return true;
		}
		return selectedAvailability[current.format('YYYY-MM-DD')] === undefined;
	};

	const generateTimeSlots = (date: Dayjs): { time: string; slot: any }[] => {
		if (showAllTimes) {
			return allTimeSlots.map((time) => ({ time, slot: null }));
		}
		if (!selectedAvailability) return [];
		const daySlots = selectedAvailability[date.format('YYYY-MM-DD')];
		if (!daySlots) return [];
		return daySlots.map(
			(slot: { start: string; end: string; hosts_ids?: number[] }) => {
				const timeString = slot.start.includes(' ')
					? slot.start.split(' ')[1]
					: slot.start;
				const time = timeString.split(':');
				return {
					time: `${time[0]}:${time[1]}`,
					slot,
				};
			}
		);
	};

	const handleDateChange = (date: Dayjs | null) => {
		setTimeOptions(date ? generateTimeSlots(date) : []);
		form.setFieldsValue({ selectTime: null });
		setSelectedTimeSlotHostsIds([]);
	};

	const handleTimeChange = (selectedTime: string) => {
		const selectedTimeOption = timeOptions.find(
			(option) => option.time === selectedTime
		);
		if (selectedTimeOption && selectedTimeOption.slot) {
			setSelectedTimeSlotHostsIds(
				selectedTimeOption.slot.hosts_ids || []
			);
		} else {
			setSelectedTimeSlotHostsIds([]);
		}
	};

	const validateRequiredFields = (
		values: Record<string, any>,
		selectedLocationType: string,
		locationData: string
	): string | null => {
		if (contactMode === 'existing') {
			if (!values.contact_id || !selectedContact?.email) {
				return __('Please select an attendee.', 'doublescale');
			}
		} else {
			if (!values.name) {
				return __('Please enter the attendee name.', 'doublescale');
			}
			if (!values.email) {
				return __('Please enter the attendee email.', 'doublescale');
			}
		}

		// Custom fields (rendered by QuestionsComponents) are stored under
		// `fields-{id}` in the  Form.Item naming — the `fields-` prefix
		// is stripped by getFields() before POSTing.
		const customFields = fields?.custom || {};
		for (const [key, def] of Object.entries(customFields)) {
			if (!def?.required || def?.enabled === false) {
				continue;
			}
			const stored = values[`fields-${key}`];
			if (stored === undefined || stored === '' || stored === null) {
				return sprintf(
					/* translators: %s: field label. */
					__('%s is required.', 'doublescale'),
					def.label
				);
			}
		}

		// Location-data is required when the selected location type has
		// required:true sub-fields (e.g. attendee_address, attendee_phone).
		// `options` lives on the runtime field payload but isn't on FieldType.
		const locationSelect = (fields?.location?.['location-select'] as
			| { options?: Array<{ value: string; fields?: Record<string, any> }> }
			| undefined) || undefined;
		const locationOptions = locationSelect?.options || [];
		const matchedOption = locationOptions.find(
			(opt) => opt?.value === selectedLocationType
		);
		const subFields = matchedOption?.fields || {};
		const requiresLocationData = Object.values(subFields).some(
			(f: any) => f?.required
		);
		if (requiresLocationData && !locationData) {
			return __(
				'Please fill in the required location details.',
				'doublescale'
			);
		}

		return null;
	};

	const handleSubmit = async (values: any) => {
		const {
			selectDate,
			selectTime,
			event,
			duration,
			status,
			hosts,
		} = values;
		let name = '';
		let email = '';
		if (contactMode === 'existing') {
			const contactName = selectedContact
				? [selectedContact.first_name, selectedContact.last_name]
						.filter(Boolean)
						.join(' ')
						.trim()
				: '';
			name = contactName || selectedContact?.email || '';
			email = selectedContact?.email || '';
		} else {
			name = (values.name || '').trim();
			email = (values.email || '').trim();
		}

		if (!selectDate || !selectTime) {
			reportError(
				__('Please pick a date and a time before saving.', 'doublescale')
			);
			return;
		}

		const startDateTime =
			selectDate.clone().format('YYYY-MM-DD') + ` ${selectTime}:00`;

		const fields = getFields(values);
		const location = form.getFieldValue('location');
		const location_data = form.getFieldValue('location-data');
		const locationField = get_location(
			selectedEvent?.location || [],
			location,
			location_data
		);

		const validationError = validateRequiredFields(
			values,
			location,
			location_data
		);
		if (validationError) {
			reportError(validationError);
			return;
		}

		const hostsToSend = hosts ? [hosts] : selectedTimeSlotHostsIds;

		try {
			await form.validateFields();
			await callApi({
				path: 'bookings',
				method: 'POST',
				data: {
					event_id: event,
					start_date: startDateTime,
					slot_time: duration,
					timezone: currentTimezone,
					fields,
					name,
					email,
					status,
					ignore_availability: ignoreAvailability,
					location: locationField,
					hosts_ids: hostsToSend,
				},
				onSuccess: () => {
					setInlineError(null);
					onSaved();
					onClose();
				},
				onError: (error) => {
					reportError(
						error ||
							__(
								'Could not save the booking. Please review the form and try again.',
								'doublescale'
							)
					);
				},
			});
		} catch (error: any) {
			reportError(
				error?.message ||
					__(
						'Please complete every required field before saving.',
						'doublescale'
					)
			);
		}
	};

	useEffect(() => {
		if (!open) {
			setFormValues({ status: 'scheduled' });
			setSelectedEvent(null);
			setSelectedAvailability(undefined);
			setTimeOptions([]);
			setSelectedTimeSlotHostsIds([]);
			setSelectedContact(null);
			setContactMode('existing');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	useEffect(() => {
		fetchCalendar();
		if (booking) {
			if (booking.event?.id) {
				handleEventChange(booking.event.id);
			}
			if (booking.timezone) {
				setCurrentTimezone(booking.timezone);
			}
			const contact = booking.contact;
			if (contact?.id) {
				setSelectedContact(contact);
			}
			form.setFieldsValue({
				event: booking.event?.id,
				contact_id: contact?.id || '',
				status: booking.status || 'scheduled',
				timezone: booking.timezone,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (selectedEvent) {
			form.resetFields(['selectDate', 'selectTime']);
			setTimeOptions([]);
			setSelectedTimeSlotHostsIds([]);
			fetchAvailability(selectedEvent.id);
		}
	}, [currentTimezone]);

	useEffect(() => {
		if (ignoreAvailability && defaultDuration) {
			const duration = defaultDuration;
			const slots: string[] = [];
			for (
				let minutes = 0;
				minutes < 24 * 60;
				minutes += Number(duration)
			) {
				const hours = Math.floor(minutes / 60);
				const mins = minutes % 60;
				slots.push(
					`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
				);
			}
			setAllTimeSlots(slots);
		}
	}, [ignoreAvailability, defaultDuration]);

	useEffect(() => {
		if (selectedEvent?.id) {
			fetchAvailability(selectedEvent.id);
			form.resetFields(['selectDate', 'selectTime']);
			setSelectedTimeSlotHostsIds([]);
		}
	}, [defaultDuration]);

	return (
        <Dialog
            open={open}
            onOpenChange={open => {
                if (!open)
                    onClose();
            }}><DialogContent className='max-w-[950px] rounded-lg z-[160100] max-h-[90vh] overflow-y-auto overflow-x-hidden max-[768px]:max-w-[calc(100vw-2rem)] max-[768px]:p-4' overlayClassName='z-[160100]'>
				<DialogHeader><DialogTitle>{<div className="flex gap-4 items-center pr-8 max-[768px]:gap-3">
                            <div className="shrink-0 rounded-lg p-2 bg-[#EDEDED] text-color-primary-text max-[768px]:p-1.5">
                                <AddCalendarOutlinedIcon width={30} height={30} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl max-[768px]:text-lg">
                                    {__('Add New Booking Manually', 'doublescale')}
                                </p>
                                <p className="text-sm text-[#979797] font-thin max-[768px]:text-xs">
                                    {__(
                                        'Fill in the details below to create a booking on behalf of an attendee.',
                                        'doublescale'
                                    )}
                                </p>
                            </div>
                        </div>}</DialogTitle></DialogHeader>
                {inlineError && (
                    <NoticeBanner
                        notice={{
                            type: 'error',
                            title: __('Something went wrong', 'doublescale'),
                            message: inlineError,
                        }}
                        closeNotice={() => setInlineError(null)}
                    />
                )}
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(formValues);
                    }}
                >
                    <div className='flex flex-col md:flex-row gap-5'>
                        <div className="flex-1 min-w-0 space-y-1">
                            <label className="text-sm font-medium">{__('Select Event', 'doublescale')}</label>
                            <Select
                                value={
                                    formValues.event
                                        ? String(formValues.event)
                                        : ''
                                }
                                onValueChange={(eventId) => {
                                    const id = Number(eventId);
                                    if (!id) {
                                        return;
                                    }
                                    form.setFieldsValue({
                                        event: id,
                                    });
                                    handleEventChange(id);
                                }}><SelectTrigger><SelectValue placeholder={__('Select Event', 'doublescale')} /></SelectTrigger><SelectContent>
                                    {calendars.flatMap((calendar) =>
                                        (calendar.events || [])
                                            .filter((event) => !event.is_disabled)
                                            .map((event) => (
                                                <SelectItem
                                                    value={String(event.id)}
                                                    key={event.id}
                                                >
                                                    {calendar.name} — {event.name}
                                                </SelectItem>
                                            ))
                                    )}
                                </SelectContent></Select>
                        </div>

                        {selectedEvent &&
                            selectedEvent?.calendar.type != 'host' &&
                            selectedEvent?.type != 'collective' && (
                                <div className="flex-1 min-w-0 space-y-1">
                                    <label className="text-sm font-medium">
                                        {__('Select Host', 'doublescale')}{' '}
                                        <span className="text-[10px] text-[#949494]">
                                            {__('(If not selected, the system will select one based on their availability)', 'doublescale')}
                                        </span>
                                    </label>
                                    <Select
                                        onValueChange={(user_id) => {
                                            const hostId = Number(user_id);
                                            if (!hostId) return;
                                            form.setFieldsValue({ hosts: hostId });
                                            fetchAvailability(selectedEvent.id, hostId);
                                        }}><SelectTrigger><SelectValue placeholder={__('Select Host', 'doublescale')} /></SelectTrigger><SelectContent>
                                            {selectedEvent.hosts &&
                                                selectedEvent.hosts.map((host) => (
                                                    <SelectItem value={String(host.id)} key={host.id}>
                                                        {host.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent></Select>
                                </div>
                            )}
                    </div>

                    <div className='flex flex-col md:flex-row gap-5'>
                        {currentTimezone && (
                            <div className="flex-1 min-w-0 mb-1 space-y-1">
                                <label className="text-sm font-medium">{__("Attendee's Timezone", 'doublescale')}</label>
                                <TimezoneSelect
                                    value={currentTimezone}
                                    onChange={setCurrentTimezone}
                                />
                                <CurrentTimeInTimezone
                                    currentTimezone={currentTimezone}
                                    className="text-[#949494] text-[12px] mt-1"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0 mb-1 space-y-1">
                            <label className="text-sm font-medium">{__('Meeting Duration', 'doublescale')}</label>
                            <Select
                                disabled={!isReady}
                                value={
                                    defaultDuration
                                        ? String(defaultDuration)
                                        : ''
                                }
                                onValueChange={(value) => {
                                    const minutes = Number(value);
                                    if (!minutes) return;
                                    setDefaultDuration(minutes);
                                    form.setFieldsValue({
                                        duration: minutes,
                                    });
                                }}><SelectTrigger><SelectValue placeholder={__('Select Duration', 'doublescale')} /></SelectTrigger><SelectContent>
                                    {selectedEvent
                                        ? isMultipleDuration
                                            ? selectedEvent?.additional_settings.selectable_durations.map(
                                                    (duration) => (
                                                        <SelectItem key={duration} value={String(duration)}>
                                                            {duration} {__('minutes', 'doublescale')}
                                                        </SelectItem>
                                                    )
                                                )
                                            : (
                                                <SelectItem value={String(selectedEvent.duration)}>
                                                    {selectedEvent.duration} {__('minutes', 'doublescale')}
                                                </SelectItem>
                                            )
                                        : null}
                                </SelectContent></Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={showAllTimes}
                            disabled={!isReady}
                            onCheckedChange={(checked) => {
                                const val = Boolean(checked);
                                setShowAllTimes(val);
                                setIgnoreAvailability(val);
                                form.setFieldsValue({ selectDate: undefined, selectTime: undefined });
                                setTimeOptions([]);
                                if (formValues.selectDate) {
                                    setTimeOptions(generateTimeSlots(formValues.selectDate));
                                }
                            }}
                        />
                        <span>{__('Ignore Availability', 'doublescale')}</span>
                    </div>

                    <div className='flex flex-col md:flex-row gap-5'>
                        <div className="flex-1 min-w-0 space-y-1">
                            <label className="text-sm font-medium">{__('Select Date', 'doublescale')}</label>
                            <Input
                                type="date"
                                className="w-full h-10"
                                disabled={!isReady}
                                value={
                                    formValues.selectDate
                                        ? formValues.selectDate.format('YYYY-MM-DD')
                                        : ''
                                }
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        const d = dayjs(val);
                                        handleDateChange(d);
                                        form.setFieldsValue({ selectDate: d });
                                    } else {
                                        form.setFieldsValue({ selectDate: undefined, selectTime: undefined });
                                        setTimeOptions([]);
                                    }
                                }}
                            />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                            <label className="text-sm font-medium">{__('Select Time', 'doublescale')}</label>
                            <Select
                                disabled={!formValues.selectDate}
                                value={formValues.selectTime || ''}
                                onValueChange={(value) => {
                                    form.setFieldsValue({ selectTime: value });
                                    handleTimeChange(value);
                                }}><SelectTrigger><SelectValue placeholder={__('Select Time', 'doublescale')} /></SelectTrigger><SelectContent>
                                    {timeOptions.map((timeOption) => (
                                        <SelectItem key={timeOption.time} value={timeOption.time}>
                                            {timeOption.time}
                                        </SelectItem>
                                    ))}
                                </SelectContent></Select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{__('Status', 'doublescale')}</label>
                        <Select
                            disabled={!isReady}
                            value={formValues.status || 'scheduled'}
                            onValueChange={(value) =>
                                form.setFieldsValue({ status: value })
                            }
                        ><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                                <SelectItem value="scheduled">{__('Scheduled', 'doublescale')}</SelectItem>
                                <SelectItem value="pending">{__('Pending', 'doublescale')}</SelectItem>
                                <SelectItem value="completed">{__('Completed', 'doublescale')}</SelectItem>
                            </SelectContent></Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium pr-1">{__('Attendee', 'doublescale')}</label>
                        <div className="inline-flex flex-wrap rounded-md border border-border/60 p-1 bg-muted/40 text-sm">
                            <button
                                type="button"
                                className={`px-3 py-1 rounded ${contactMode === 'existing' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}
                                onClick={() => setContactMode('existing')}
                            >
                                {__('Existing contact', 'doublescale')}
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1 rounded ${contactMode === 'new' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}
                                onClick={() => {
                                    setContactMode('new');
                                    setSelectedContact(null);
                                    form.setFieldsValue({ contact_id: '' });
                                }}
                            >
                                {__('New contact', 'doublescale')}
                            </button>
                        </div>

                        {contactMode === 'existing' ? (
                            <InfiniteScrollSelect
                                value={formValues.contact_id || ''}
                                onValueChange={(value, item) => {
                                    form.setFieldsValue({ contact_id: value });
                                    setSelectedContact(item || null);
                                }}
                                placeholder={__('Search contacts by name or email…', 'doublescale')}
                                apiEndpoint="/doublescale/v1/contacts"
                                searchParamName="keyword"
                                getOptionLabel={(c: any) => {
                                    const name = [c?.first_name, c?.last_name]
                                        .filter(Boolean)
                                        .join(' ')
                                        .trim();
                                    return name ? `${name} (${c?.email})` : (c?.email || '');
                                }}
                                getOptionValue={(c: any) => c?.id}
                                dataPath="data"
                                totalPath="total"
                                perPage={20}
                                selectedItem={selectedContact}
                            />
                        ) : (
                            <div className="flex flex-col md:flex-row gap-5">
                                <div className="flex-1 min-w-0 space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">{__("Attendee's Name", 'doublescale')}</label>
                                    <Input
                                        value={formValues.name || ''}
                                        onChange={(e) =>
                                            form.setFieldsValue({ name: e.target.value })
                                        }
                                        placeholder={__("Type the attendee's name", 'doublescale')}
                                        required
                                    />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">{__("Attendee's Email", 'doublescale')}</label>
                                    <Input
                                        type="email"
                                        value={formValues.email || ''}
                                        onChange={(e) =>
                                            form.setFieldsValue({ email: e.target.value })
                                        }
                                        placeholder={__("Type the attendee's email", 'doublescale')}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        {contactMode === 'new' && (
                            <p className="text-xs text-muted-foreground">
                                {__('A new contact will be created (or matched by email) when the booking is saved.', 'doublescale')}
                            </p>
                        )}
                    </div>
                    {fields && <QuestionsComponents fields={fields} form={form} />}
                    <div className="flex justify-end">
                     <Button
                        type="submit"
                        disabled={!selectedEvent || loading}

                     >
                        {loading ? __('Saving...', 'doublescale') : __('Save Booking', 'doublescale')}
                     </Button>
                    </div>
                </form>
            </DialogContent></Dialog>
    );
};

export default AddBookingModal;
