/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useState,
} from '@wordpress/element';

import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { useApi, useBreadcrumbs, useEvent } from '@/hooks/booking';
import EventInfo from './event-info';
import LivePreview from './live-preview';
import Duration from './duration';
import GroupSettings from './group-settings';
import {
	CardHeader,
	EventLocIcon,
	NoticeBanner,
	Locations,
} from '@/components/booking';
import { EventTabHandle } from '@/types/booking';
import TeamAssignment from './team-assignment';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const EventDetailsShimmer = () => {
	return (
        <div className="w-full ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				<div className='flex flex-col gap-5'>
					<Card><CardContent>
                            <div className='flex flex-col gap-5'>
                                <Skeleton className='h-10 w-full rounded-md' />
                                <Skeleton className='h-10 w-full rounded-md' />
                                <Skeleton className='h-10 w-full rounded-md' />
                                <div className='flex gap-2.5'>
                                    <Skeleton className='h-10 w-24 rounded-md' />
                                    <Skeleton className='h-10 w-24 rounded-md' />
                                </div>
                            </div>
                        </CardContent></Card>
					<Card><CardContent>
                            <div className='flex flex-col gap-5'>
                                <Skeleton className='h-10 w-full rounded-md' />
                                <Skeleton className='h-10 w-full rounded-md' />
                                <div className='flex gap-2.5'>
                                    <Skeleton className='h-10 w-24 rounded-md' />
                                    <Skeleton className='h-10 w-24 rounded-md' />
                                    <Skeleton className='h-10 w-24 rounded-md' />
                                </div>
                            </div>
                        </CardContent></Card>
				</div>
				<div className='flex flex-col gap-5'>
					<Card><CardContent>
                            <Skeleton className='h-10 w-full rounded-md' />
                        </CardContent></Card>
					<Card><CardContent>
                            <div className='flex flex-col gap-5'>
                                <Skeleton className='h-10 w-full rounded-md' />
                                <Skeleton className='h-10 w-full rounded-md' />
                                <div className='flex gap-2.5'>
                                    <Skeleton className='h-10 w-24 rounded-md' />
                                    <Skeleton className='h-10 w-24 rounded-md' />
                                </div>
                            </div>
                        </CardContent></Card>
				</div>
			</div>
        </div>
    );
};

/**
 * Event General Settings Component.
 */
interface EventDetailsProps {
	onKeepDialogOpen: () => void;
	notice: { title: string; message: string } | null;
	clearNotice: () => void;
	setDisabled: (disabled: boolean) => void;
}

const EventDetails = forwardRef<EventTabHandle, EventDetailsProps>(
	({ onKeepDialogOpen, notice, clearNotice, setDisabled }, ref) => {
		// Use event store instead of context
		const {
			currentEvent: event,
			setEvent,
			loading: eventLoading,
		} = useEvent();

		const { callApi } = useApi();
		const setBreadcrumbs = useBreadcrumbs();
		const [isInitialLoading, setIsInitialLoading] = useState(true);

		useEffect(() => {
			if (event) {
				setIsInitialLoading(false);
			}
		}, [event]);

		// Implement useImperativeHandle to expose the saveSettings method
		useImperativeHandle(ref, () => ({
			saveSettings: async () => {
				if (event) {
					return saveSettings();
				}
				return Promise.resolve();
			},
		}));

		useEffect(() => {
			if (!event) {
				return;
			}

			setBreadcrumbs([
				{
					path: `calendars/${event.calendar_id}/events/${event.id}/general`,
					title: __('General', 'doublescale'),
				},
			]);
		}, [event?.id]); // Only depend on event ID to prevent unnecessary rerenders

		// Show loading state if event store is loading
		if (eventLoading || isInitialLoading) {
			return <EventDetailsShimmer />;
		}

		// Show error state if no event in store
		if (!event) {
			return (
                <div className="w-full px-9">
                    <Card className="text-center py-8"><CardContent>
                            <p className="text-gray-500">
                                {__('No event selected', 'doublescale')}
                            </p>
                        </CardContent></Card>
                </div>
            );
		}

		const saveSettings = async () => {
			try {
				if (!validate()) return;

				await callApi({
					path: `events/${event.id}`,
					method: 'PUT',
					data: event,
					onSuccess: (response) => {
						// Update the event state in the store with the response data
						setEvent(response);
						setDisabled(true);
					},
					onError: (error) => {
						// Re-throw to be caught by the outer try-catch
						throw new Error(error);
					},
				});
			} catch (error: any) {
				console.error('Error saving event settings:', error);
				// No error notice shown as per original implementation
				// Re-throw if you want calling code to handle it
				throw new Error(error.message);
			}
		};

		const handleChange = (key: string, value: any) => {
			setEvent({ ...event, [key]: value });
			setDisabled(false);
		};

		const handleAdditionalSettingsChange = (key: string, value: any) => {
			const updatedEvent = {
				...event,
				additional_settings: {
					...event.additional_settings,
					[key]: value,
				},
			};
			setEvent(updatedEvent);
			setDisabled(false);
		};

		const handleGroupSettingsChange = (
			key: 'max_invites' | 'show_remaining',
			value: number | boolean
		) => {
			const updatedEvent = {
				...event,
				group_settings: {
					max_invites:
						key === 'max_invites'
							? (value as number)
							: (event.group_settings?.max_invites ?? 30),
					show_remaining:
						key === 'show_remaining'
							? (value as boolean)
							: (event.group_settings?.show_remaining ?? true),
				},
			};
			setEvent(updatedEvent);
			setDisabled(false);
		};

		const validate = () => {
			if (!event.name) {
				throw new Error(
					__('Please enter a name for the event.', 'doublescale')
				);
			}

			if (!event.duration || event.duration <= 0) {
				throw new Error(
					__(
						'Please enter a valid duration for the event.',
						'doublescale'
					)
				);
			}

			if (
				event.additional_settings.allow_attendees_to_select_duration &&
				event.additional_settings.selectable_durations.length === 0
			) {
				throw new Error(
					__(
						'Please select at least one duration for the event.',
						'doublescale'
					)
				);
			}

			return true;
		};

		const getDefaultDurationOptions = () => {
			const options = get(
				event,
				'additional_settings.selectable_durations'
			)
				? get(event, 'additional_settings.selectable_durations').map(
						(duration) => ({
							value: duration,
							label: `${duration} minutes`,
						})
					)
				: [];

			return options;
		};

		return (
            <div className="w-full">
                {notice && (
					<NoticeBanner
						notice={{
							type: 'success',
							title: notice.title,
							message: notice.message,
						}}
						closeNotice={clearNotice}
					/>
				)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<div className='flex flex-col gap-5'>
						<EventInfo
							name={event.name}
							description={event.description}
							color={event.color}
							onChange={handleChange}
						/>

						{event.calendar.type === 'team' && (
							<TeamAssignment
								team={
									Array.isArray(event.hosts) &&
									event.hosts.length > 0
										? event.hosts
										: []
								}
								calendarId={event.calendar.id}
								onChange={handleChange}
							/>
						)}

						<div className='flex flex-col gap-5'>
							<Duration
								duration={event.duration}
								onChange={handleChange}
								handleAdditionalSettingsChange={
									handleAdditionalSettingsChange
								}
								getDefaultDurationOptions={
									getDefaultDurationOptions
								}
								allow_attendees_to_select_duration={
									event.additional_settings
										.allow_attendees_to_select_duration
								}
								selectable_durations={
									event.additional_settings
										.selectable_durations
								}
								default_duration={
									event.additional_settings.default_duration
								}
							/>
							{event.type === 'group' && (
								<GroupSettings
									maxInvites={
										event.group_settings?.max_invites ?? 2
									}
									showRemaining={
										event.group_settings?.show_remaining ??
										true
									}
									onChange={handleGroupSettingsChange}
								/>
							)}
						</div>
					</div>
					<div className='flex flex-col gap-5'>
						<LivePreview
							name={event.name}
							hosts={event.hosts || []}
							duration={event.duration}
							locations={event.location || []}
							color={event.color}
						/>
						<Card><CardContent>
                                <div className='flex flex-col gap-5'>
                                    <CardHeader
                                        title={__('Event Location', 'doublescale')}
                                        description={__(
                                            'Select Where you will Meet Guests.',
                                            'doublescale'
                                        )}
                                        icon={<EventLocIcon />}
                                    />
                                    <div className='flex justify-between'>
                                        <div className="text-[#09090B] text-[16px]">
                                            {__(
                                                'How Will You Meet',
                                                'doublescale'
                                            )}
                                            <span className="text-red-500">*</span>
                                        </div>
                                        <div className="text-[#848484] italic">
                                            {__(
                                                'You Can Select More Than One',
                                                'doublescale'
                                            )}
                                        </div>
                                    </div>
                                    <div className='flex flex-col gap-[15px]'>
                                        <Locations
                                            locations={event.location}
                                            connected_integrations={
                                                event.connected_integrations
                                            }
                                            onChange={(updatedLocations) =>
                                                handleChange(
                                                    'location',
                                                    updatedLocations
                                                )
                                            }
                                            onKeepDialogOpen={onKeepDialogOpen}
                                            calendar={event.calendar}
                                        />
                                    </div>
                                </div>
                            </CardContent></Card>
					</div>
				</div>
            </div>
        );
	}
);

export default EventDetails;
