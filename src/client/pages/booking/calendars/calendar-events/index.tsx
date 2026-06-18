/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { IoEllipsisHorizontal as SlOptions } from 'react-icons/io5';
import { useEffect, useState } from 'react';

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

/**
 * Internal dependencies
 */
import type { Calendar, Event } from '@/types/booking';
import ConfigAPI from '@/config/booking';
import {
	CloneIcon,
	ShareIcon,
	TimeIcon,
	LocationIcon,
	DateIcon,
	CalendarAddIcon,
	BookingNumIcon,
	UpcomingCalendarIcon,
	ShareModal,
	EventPrice,
} from '@/components/booking';
import { useCopyToClipboard } from '@/hooks/booking';
import EventActions from '../event-actions';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Calendar Events Component.
 */
const CalendarEvents: React.FC<{
	calendar: Calendar;
	typesLabels: Record<string, string>;
	updateCalendarEvents: () => void;
	setStatusMessage: (message: boolean) => void;
	setDeleteMessage: (message: boolean) => void;
	setCloneMessage: (message: boolean) => void;
	setErrorMessage?: (message: string | null) => void;
	navigate: (path: string) => void;
	onCreateEvent?: (calendarId: number) => void;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
}> = ({
	calendar,
	typesLabels: _typesLabels,
	updateCalendarEvents,
	setStatusMessage,
	setDeleteMessage,
	setCloneMessage,
	setErrorMessage,
	navigate,
	onCreateEvent,
}) => {
		const siteUrl = ConfigAPI.getSiteUrl();
		const copyToClipboard = useCopyToClipboard();
		const [modalShareId, setModalShareId] = useState<number | null>(null);
		const [disabledEvents, setDisabledEvents] = useState<
			Record<string, boolean>
		>({});
		const [events, setEvents] = useState(calendar.events);

		// Initialize disabledEvents state based on initial event status
		useEffect(() => {
			const initialDisabledState: Record<string, boolean> = {};
			calendar.events.forEach((event) => {
				if (event.id) {
					initialDisabledState[event.id] = !!event.is_disabled;
				}
			});
			setDisabledEvents(initialDisabledState);
			setEvents(calendar.events);
		}, [calendar.events]);

		// Function to handle event disable status change
		const handleEventStatusChange = (
			eventId: number | undefined,
			disabled: boolean
		) => {
			if (eventId) {
				setDisabledEvents((prev) => ({
					...prev,
					[eventId]: disabled,
				}));
			}
		};

		return (
            <>
                {events.length > 0 ? (
					<div className="doublescale-booking-calendar-events">
						{events.map((event) => {
							const isDisabled = event.id
								? disabledEvents[event.id]
								: event.is_disabled;

							return (
                                <Card
									key={event.id}
									className={`doublescale-booking-calendar-event w-full md:w-[308px] border-t-4 border-t-primary rounded-xl ${isDisabled ? 'opacity-50' : ''}`}
								><CardContent>
                                        <div className='flex gap-5 flex-col'>
                                            <div className='flex justify-between border-b pb-2'>
                                                <div className='flex flex-col gap-0.5'>
                                                    <h5
                                                        style={{ margin: 0 }}
                                                        className="capitalize text-[16px] font-[700] text-[#313131]">
                                                        {event.name}
                                                    </h5>
                                                    <span
                                                        className="text-[#1A1A1A99] text-[14px] font-[400] flex items-center gap-2">
                                                        <TimeIcon />
                                                        {event.duration}{' '}
                                                        {__('Mins', 'doublescale')}
                                                    </span>
                                                </div>
                                                <EventActions
                                                    navigate={navigate}
                                                    event={event}
                                                    calendarId={calendar.id}
                                                    updateCalendarEvents={
                                                        updateCalendarEvents
                                                    }
                                                    isDisabled={isDisabled}
                                                    setDisabledEvents={
                                                        handleEventStatusChange
                                                    }
                                                    setDeleteMessage={
                                                        setDeleteMessage
                                                    }
                                                    setStatusMessage={
                                                        setStatusMessage
                                                    }
                                                    setCloneMessage={
                                                        setCloneMessage
                                                    }
                                                    setErrorMessage={
                                                        setErrorMessage
                                                    }
                                                    trigger={
                                                        <Button
                                                            className="bg-[#EDEBEB] border-none rounded-xl"
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={__(
                                                                'Event actions',
                                                                'doublescale'
                                                            )}
                                                        >
                                                            <SlOptions className="text-color-primary-text text-[18px]" />
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                            <div className='flex flex-col justify-center gap-2.5'>
                                                <div className='flex gap-2.5 items-center'>
                                                    <div className="flex-shrink-0">
                                                        <LocationIcon />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[#71717A] text-[12px]">
                                                            {__(
                                                                'Location',
                                                                'doublescale'
                                                            )}
                                                        </span>
                                                        {event.location?.length === 1 ? (
                                                            <span className="text-[#09090B] text-[14px] font-[500] capitalize">
                                                                {event.location[0]?.type
                                                                    ?.split('_')
                                                                    .join(' ')}
                                                            </span>
                                                        ) : event.location?.length > 1 ? (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <span className="text-[#09090B] text-[14px] font-[500] capitalize cursor-pointer">
                                                                        {
                                                                            event.location
                                                                                .length
                                                                        }{' '}
                                                                        {__(
                                                                            'Locations',
                                                                            'doublescale'
                                                                        )}
                                                                    </span>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto">
                                                                    <div>
                                                                        {event.location.map(
                                                                            (
                                                                                loc,
                                                                                index
                                                                            ) => {
                                                                                let displayText =
                                                                                    '';
                                                                                if (
                                                                                    loc.type ===
                                                                                    'custom' &&
                                                                                    loc.fields &&
                                                                                    loc
                                                                                        .fields
                                                                                        .location
                                                                                ) {
                                                                                    displayText =
                                                                                        loc
                                                                                            .fields
                                                                                            .location;
                                                                                } else {
                                                                                    displayText =
                                                                                        loc.type
                                                                                            .split(
                                                                                                '_'
                                                                                            )
                                                                                            .join(
                                                                                                ' '
                                                                                            );
                                                                                }
                                                                                return (
                                                                                    <div
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="capitalize"
                                                                                    >
                                                                                        {
                                                                                            displayText
                                                                                        }
                                                                                    </div>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <div className='flex gap-2.5 items-center'>
                                                    <DateIcon />
                                                    <div className="flex flex-col">
                                                        <span className="text-[#71717A] text-[12px]">
                                                            {__(
                                                                'Event Type',
                                                                'doublescale'
                                                            )}
                                                        </span>
                                                        <span className="text-[#09090B] text-[14px] font-[500] capitalize">
                                                            {event.type}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* static */}
                                                <div className='flex gap-2.5 items-center'>
                                                    <BookingNumIcon />
                                                    <div className="flex flex-col">
                                                        <span className="text-[#71717A] text-[12px]">
                                                            {__(
                                                                'Number of Bookings',
                                                                'doublescale'
                                                            )}
                                                        </span>
                                                        <span className="text-[#09090B] text-[14px] font-[500] capitalize">
                                                            {event.booking_count}
                                                        </span>
                                                    </div>
                                                </div>

                                                <EventPrice
                                                    payments_settings={
                                                        event.payments_settings
                                                    }
                                                    duration={
                                                        event.additional_settings
                                                            .default_duration
                                                    }
                                                />
                                            </div>
                                            <div className='flex justify-between border-t pt-3'>
                                                <Button
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            `${siteUrl}?doublescale_booking_event=${event.slug}`,
                                                            __(
                                                                'Link copied',
                                                                'doublescale'
                                                            )
                                                        )
                                                    }
                                                    style={{
                                                        paddingLeft: 0,
                                                        paddingRight: 0,
                                                    }}
                                                    disabled={isDisabled}
                                                    variant='ghost'>{<CloneIcon />}
                                                    {__('Copy Link', 'doublescale')}
                                                </Button>
                                                <Button
                                                    style={{
                                                        paddingLeft: 0,
                                                        paddingRight: 0,
                                                    }}
                                                    onClick={() =>
                                                        setModalShareId(event.id)
                                                    }
                                                    disabled={isDisabled}
                                                    variant='ghost'>{<ShareIcon />}
                                                    {__('Share', 'doublescale')}
                                                </Button>
                                                {modalShareId !== null && (
                                                    <ShareModal
                                                        open={modalShareId !== null}
                                                        onClose={() =>
                                                            setModalShareId(null)
                                                        }
                                                        url={`${siteUrl}?doublescale_booking_event=${events.find(
                                                            (event) =>
                                                                event.id ===
                                                                modalShareId
                                                        )?.slug || ''
                                                            }`}
                                                        event={event as Event}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </CardContent></Card>
                            );
						})}
						{calendar.type == 'host' && onCreateEvent && (
							<>
								<Button
									className="text-primary border-2 [&_svg]:size-10 border-primary bg-tertiary border-dashed font-[600] w-full sm:w-[310px] text-[20px] flex flex-col items-center justify-center text-center h-[385px] hover:text-white"
									onClick={() => onCreateEvent(calendar.id)}
								>
									<CalendarAddIcon width={40} height={40}/>
									<span className="pt-[8.5px] text-center self-center">
										{__('Create Event', 'doublescale')}
									</span>
								</Button>
							</>
						)}
					</div>
				) : (
					<div className="doublescale-booking-calendar-no-events">
						{calendar.type == 'team' && (
							<>
								<div className='flex flex-col gap-[30px] justify-center items-center py-10'>
									<div className="border rounded-full p-7 bg-[#F4F5FA] border-[#E1E2E9] text-[#BEC0CA]">
										<UpcomingCalendarIcon
											width={60}
											height={60}
										/>
									</div>
									<div className='flex flex-col gap-[5px] justify-center items-center'>
										<span className="text-[20px] font-medium text-black">
											{__(
												'No Events Added Yet?',
												'doublescale'
											)}
										</span>
									</div>
								</div>
							</>
						)}
						{calendar.type == 'host' && (
							<>
								<div className='flex flex-col gap-[30px] justify-center items-center py-10'>
									<div className="border rounded-full p-7 bg-[#F4F5FA] border-[#E1E2E9] text-[#BEC0CA]">
										<UpcomingCalendarIcon
											width={60}
											height={60}
										/>
									</div>
									<div className='flex flex-col gap-[5px] justify-center items-center'>
										<span className="text-[20px] font-medium text-black">
											{__(
												'No Events Added Yet?',
												'doublescale'
											)}
										</span>
										<span className="text-[#8B8D97]">
											{__(
												'You can also create Teams and manage their events',
												'doublescale'
											)}
										</span>
									</div>
									{onCreateEvent && (
										<Button
											variant='default'
											onClick={() =>
												onCreateEvent(calendar.id)
											}
										>
											{__(
												'+ Add New Event',
												'doublescale'
											)}
										</Button>
									)}
								</div>
							</>
						)}
					</div>
				)}
            </>
        );
	};

export default CalendarEvents;
