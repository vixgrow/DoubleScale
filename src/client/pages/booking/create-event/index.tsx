/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	GroupIcon,
	Header,
	RoundRobinIcon,
	ShareEventIcon,
	SingleIcon,
	Locations,
	ColorSelector,
	NoticeBanner,
	CollectiveIcon,
} from '@/components/booking';
import { useApi, useNotice, useNavigate } from '@/hooks/booking';
import type {
	Event,
	Host,
	NoticeMessage,
	GroupSettings as GroupSettingsType,
} from '@/types/booking';
import GroupSettings from '../event/tabs/details/group-settings';
import './style.scss';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { cn } from '@/lib/utils';

/**
 * Create Event Component.
 */
interface CreateEventProps {
	visible: boolean;
	setVisible: (val: boolean) => void;
	onClose: () => void;
	calendarType: string;
	calendarId: number;
}

const CreateEvent: React.FC<CreateEventProps> = ({
	visible,
	setVisible,
	onClose,
	calendarType,
	calendarId,
}) => {
	const [current, setCurrent] = useState(0);
	const { callApi, loading } = useApi();
	const { successNotice } = useNotice();
	const navigate = useNavigate();
	const [teamMembers, setTeamMembers] = useState<Host[]>([]);
	const [event, setEvent] = useState<Partial<Event>>({
		name: '',
		description: '',
		type: undefined,
		calendar_id: calendarId,
		status: 'active',
		duration: 30,
		color: '',
		visibility: 'public',
		location: [],
		hosts: [],
		additional_settings: {
			max_invitees: 1,
			show_remaining: true,
			selectable_durations: [],
			default_duration: 15,
			allow_attendees_to_select_duration: false,
			allow_additional_guests: false,
		},
		group_settings: {
			max_invites: 2,
			show_remaining: true,
		},
		connected_integrations: {
			apple: {
				name: 'apple',
				connected: false,
				has_settings: false,
				has_accounts: false,
				has_get_started: false,
				has_pro_version: false,
			},
			google: {
				name: 'google',
				connected: false,
				has_settings: false,
				has_accounts: false,
				has_get_started: false,
				has_pro_version: false,
			},
			outlook: {
				name: 'outlook',
				connected: false,
				has_settings: false,
				has_accounts: false,
				teams_enabled: false,
				has_get_started: false,
				has_pro_version: false,
			},
			twilio: {
				name: 'twilio',
				connected: false,
				has_settings: false,
				has_accounts: false,
				has_get_started: false,
				has_pro_version: false,
			},
			zoom: {
				name: 'zoom',
				connected: false,
				has_settings: false,
				has_accounts: false,
				has_get_started: false,
				has_pro_version: false,
			},
		},
	});

	const [validationErrors, setValidationErrors] = useState({
		name: false,
		location: false,
		members: false,
	});

	const [errorBanner, setErrorBanner] = useState<NoticeMessage | null>(null);

	const next = () => {
		// For step 1 (current === 0), we only need to check event.type
		if (current === 0) {
			if (!event.type) {
				setErrorBanner({
					type: 'error',
					title: __('Validation Error', 'doublescale'),
					message: __('Please select an event type', 'doublescale'),
				});
				return;
			}

			if (
				calendarType === 'team' &&
				(!event.hosts || event.hosts.length === 0)
			) {
				setValidationErrors((prev) => ({ ...prev, members: true }));
				setErrorBanner({
					type: 'error',
					title: __('Validation Error', 'doublescale'),
					message: __(
						'Please select at least one team member',
						'doublescale'
					),
				});
				return;
			}
		}

		// For step 2 (current === 1), validate name and description
		if (current === 1) {
			const errors = {
				name: !event.name,
				location: false,
				members: false,
			};

			setValidationErrors(errors);

			if (errors.name) {
				setErrorBanner({
					type: 'error',
					title: __('Validation Error', 'doublescale'),
					message: __('Please enter an event name', 'doublescale'),
				});
				return;
			}
		}

		setErrorBanner(null);
		setCurrent((prev) => prev + 1);
	};
	const prev = () => setCurrent((prev) => prev - 1);

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

	const handleChange = (key: string, value: any) => {
		setEvent({ ...event, [key]: value });
	};

	const handleGroupSettingsChange = (
		key: keyof GroupSettingsType,
		value: any
	) => {
		setEvent({
			...event,
			group_settings: {
				max_invites:
					key === 'max_invites'
						? value
						: (event.group_settings?.max_invites ?? 2),
				show_remaining:
					key === 'show_remaining'
						? value
						: (event.group_settings?.show_remaining ?? true),
			},
		});
	};

	const handleSubmit = async () => {
		try {
			// Validation check
			const hostsRequired =
				calendarType === 'team' &&
				(event.type === 'collective' || event.type === 'round-robin');
			const isHostsEmpty = !event.hosts || event.hosts.length === 0;
			if (
				!event.name ||
				!event.location ||
				event.location.length === 0 ||
				(hostsRequired && isHostsEmpty)
			) {
				setValidationErrors({
					name: !event.name,
					location: !event.location || event.location.length === 0,
					members: hostsRequired && isHostsEmpty,
				});
				let errorMessage = __(
					'Please fill in all required fields',
					'doublescale'
				);
				if (hostsRequired && isHostsEmpty) {
					errorMessage = __(
						'Please select at least one team member for collective events',
						'doublescale'
					);
				}
				setErrorBanner({
					type: 'error',
					title: __('Validation Error', 'doublescale'),
					message: errorMessage,
				});
				return;
			}
			// Transform event.hosts to an array of ids
			const transformedEvent = {
				...event,
				hosts: event.hosts?.map((host) => host.id) || [],
			};
			try {
				await callApi({
					path: 'events',
					method: 'POST',
					data: transformedEvent,
					onSuccess: (response: Event) => {
						successNotice(
							__('Event created successfully', 'doublescale')
						);
						navigate(
							`booking/calendars/${calendarId}/events/${response.id}`
						);
					},
					onError: (error) => {
						const message =
							typeof error === 'string'
								? error
								: typeof error === 'object' &&
									  error !== null &&
									  typeof (error as { message?: unknown })
											.message === 'string'
									? (error as { message: string }).message
									: __(
											'Could not create the event. Please try again.',
											'doublescale'
										);
						setErrorBanner({
							type: 'error',
							title: __('Error', 'doublescale'),
							message,
						});
					},
				});
			} catch (apiError) {
				setErrorBanner({
					type: 'error',
					title: __('API Error', 'doublescale'),
					message: __(
						'Failed to communicate with the server. Please try again.',
						'doublescale'
					),
				});
				console.error('API call failed:', apiError);
			}
		} catch (error) {
			setErrorBanner({
				type: 'error',
				title: __('Unexpected Error', 'doublescale'),
				message: __(
					'An unexpected error occurred. Please try again.',
					'doublescale'
				),
			});
			console.error('Unexpected error in handleSubmit:', error);
		}
	};

	const fetchCalendarTeam = () => {
		callApi({
			path: 'calendars/' + calendarId + '/team',
			method: 'GET',
			onSuccess: (response: any[]) => {
				const transformedHosts: Host[] = response.map((member) => ({
					id: member.ID,
					name: member.display_name,
					image: '', // or member.image if available
					availabilities: [], // populated later when team-availability schedules load
				}));
				setTeamMembers(transformedHosts);
			},
		});
	};

	const selectedTeamMemberIdsKey = useMemo(() => {
		return (event.hosts ?? [])
			.map((h) => h.id)
			.sort((a, b) => a - b)
			.join(',');
	}, [event.hosts]);

	const fetchConnectedIntegrations = useCallback(() => {
		const hostQuery =
			calendarType === 'team' && selectedTeamMemberIdsKey !== ''
				? `?host_user_ids=${encodeURIComponent(selectedTeamMemberIdsKey)}`
				: '';
		callApi({
			path: `calendars/${calendarId}/integrations${hostQuery}`,
			method: 'GET',
			onSuccess: (response) => {
				setEvent((prevEvent) => ({
					...prevEvent,
					connected_integrations: response,
				}));
			},
			onError: (error) => {
				console.log(error);
			},
		});
	}, [calendarId, calendarType, selectedTeamMemberIdsKey, callApi]);

	// Team list follows the calendar; integrations must match this host calendar.
	// Team list follows the calendar; integrations must match this host calendar.
	useEffect(() => {
		fetchCalendarTeam();
		fetchConnectedIntegrations();
	}, [calendarId, fetchConnectedIntegrations]);

	// Setup Location (step 3) reads `connected_integrations`. Refetch when landing here so we
	// never show stale "Add an account…" after the first GET lost a race with fast step navigation.
	useEffect(() => {
		if (current !== 2) {
			return;
		}
		fetchConnectedIntegrations();
	}, [current, fetchConnectedIntegrations]);


	const teamMemberOptions: MultiSelectOption[] = teamMembers.map(
		(member) => ({
			label: member.name,
			value: String(member.id),
		})
	);

	const selectedTeamMembers: MultiSelectOption[] = (event.hosts || []).map(
		(host) => ({
			label: host.name,
			value: String(host.id),
		})
	);

	const onTeamMembersChange = (selected: MultiSelectOption[]) => {
		const selectedIds = selected.map((option) => Number(option.value));
		const selectedHosts = teamMembers.filter((member) =>
			selectedIds.includes(member.id)
		);
		setEvent({
			...event,
			hosts: selectedHosts,
		});
		setValidationErrors((prev) => ({
			...prev,
			members: false,
		}));
	};

	const steps = [
		{
			title: __('Select Event Type', 'doublescale'),
			content: (
				<div className="flex flex-col">
					{calendarType === 'team' && (
						<div className="flex gap-1 flex-col">
							<div className="text-[#09090B] text-[16px]">
								{__('Select Team Members', 'doublescale')}
								<span className="text-red-500">*</span>
							</div>
							<MultiSelect
								options={teamMemberOptions}
								selected={selectedTeamMembers}
								onChange={onTeamMembersChange}
								placeholder={__(
									'Select team members',
									'doublescale'
								)}
							/>
							{validationErrors.members && (
								<span className="text-red-500 text-sm">
									{__(
										'At least one team member is required',
										'doublescale'
									)}
								</span>
							)}
							<span className="text-[#818181] text-[12px]">
								{__(
									'Select the members you want to assign to this team.',
									'doublescale'
								)}
							</span>
						</div>
					)}
					{calendarType === 'team' && (
						<div className="flex flex-col gap-5 mt-5">
							<Card
								onClick={() =>
									setEvent({ ...event, type: 'round-robin' })
								}
								className={cn(
									'cursor-pointer rounded-xl border-2 pl-2',
									event.type === 'round-robin' &&
										'border-primary'
								)}
							>
								<CardContent>
									<div className="flex gap-[15px] items-center">
										<RoundRobinIcon />
										<div className="flex flex-col">
											<h3 className="text-[#2E2C2F] text-[18px] font-bold">
												{__(
													'Round Robin',
													'doublescale'
												)}
											</h3>
											<span className="text-[14px] text-[#979797]">
												<span className="font-semibold mr-1">
													{__(
														'One rotating host',
														'doublescale'
													)}
												</span>
												{__('with', 'doublescale')}
												<span className="font-semibold ml-1">
													{__(
														'One Invitee',
														'doublescale'
													)}
												</span>
											</span>
											<span className="text-[12px] text-[#979797]">
												{' '}
												{__(
													'Good for Distributing Incoming Sales Leads.',
													'doublescale'
												)}
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
							<Card
								onClick={() =>
									setEvent({ ...event, type: 'collective' })
								}
								className={cn(
									'cursor-pointer rounded-xl border-2 pl-2',
									event.type === 'collective' &&
										'border-primary'
								)}
							>
								<CardContent>
									<div className="flex gap-[15px] items-center">
										<CollectiveIcon />
										<div className="flex flex-col">
											<h3 className="text-[#2E2C2F] text-[18px] font-bold">
												{__(
													'Collective',
													'doublescale'
												)}
											</h3>
											<span className="text-[14px] text-[#979797]">
												<span className="font-semibold mr-1">
													{__(
														'Multi Hosts',
														'doublescale'
													)}
												</span>
												{__('with', 'doublescale')}
												<span className="font-semibold ml-1">
													{__(
														'One Invitee',
														'doublescale'
													)}
												</span>
											</span>
											<span className="text-[12px] text-[#979797]">
												{' '}
												{__(
													'Good for Panel Interviews, Group Sales Calls, etc.',
													'doublescale'
												)}
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					{calendarType !== 'team' && (
						<div className="flex flex-col gap-5 mt-5">
							<Card
								onClick={() =>
									setEvent({ ...event, type: 'one-to-one' })
								}
								className={cn(
									'cursor-pointer rounded-xl border-2 pl-2',
									event.type === 'one-to-one' &&
										'border-primary'
								)}
							>
								<CardContent>
									<div className="flex gap-[15px] items-center">
										<SingleIcon />
										<div className="flex flex-col">
											<h3 className="text-[#2E2C2F] text-[18px] font-bold">
												{__(
													'Single Event',
													'doublescale'
												)}
											</h3>
											<span className="text-[14px] text-[#979797]">
												<span className="font-semibold mr-1">
													{__(
														'Invite Someone',
														'doublescale'
													)}
												</span>
												{__(
													'to pick a time to meet with',
													'doublescale'
												)}
												<span className="font-semibold ml-1">
													{__(
														'hosts.',
														'doublescale'
													)}
												</span>
											</span>
											<span className="text-[12px] text-[#979797]">
												{' '}
												{__(
													'good for higher priority meetings',
													'doublescale'
												)}
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
							<Card
								onClick={() =>
									setEvent({ ...event, type: 'group' })
								}
								className={cn(
									'cursor-pointer rounded-xl border-2 pl-2',
									event.type === 'group' &&
										'border-primary'
								)}
							>
								<CardContent>
									<div className="flex gap-[15px] items-center">
										<GroupIcon />
										<div className="flex flex-col">
											<h3 className="text-[#2E2C2F] text-[18px] font-bold">
												{__(
													'Group Event',
													'doublescale'
												)}
											</h3>
											<span className="text-[14px] text-[#979797]">
												<span className="font-semibold mr-1">
													{__(
														'Reserve Spots',
														'doublescale'
													)}
												</span>
												{__(
													'for a Scheduled event with',
													'doublescale'
												)}
												<span className="font-semibold ml-1">
													{__(
														'hosts.',
														'doublescale'
													)}
												</span>
											</span>
											<span className="text-[12px] text-[#979797]">
												{' '}
												{__(
													'good for reservation or ticketing system.',
													'doublescale'
												)}
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					)}
				</div>
			),
		},
		{
			title: __('Event Name & Duration', 'doublescale'),
			content: (
				<div className="flex flex-col gap-5">
					<Card>
						<CardContent>
							<div className="flex flex-col">
								<div className="flex gap-1 flex-col">
									<div className="text-[#09090B] text-[16px]">
										{__(
											'Event Calendar Name',
											'doublescale'
										)}
										<span className="text-red-500">*</span>
									</div>
									<Input
										value={event.name}
										onChange={(e) => {
											handleChange('name', e.target.value);
											setValidationErrors((prevErrors) => ({
												...prevErrors,
												name: false,
											}));
										}}
										placeholder={__(
											'Enter name of this event calendar',
											'doublescale'
										)}
										className={cn(
											'h-[48px] rounded-lg',
											validationErrors.name &&
												'border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500'
										)}
									/>
									{validationErrors.name && (
										<span className="text-red-500 text-sm">
											{__(
												'Event name is required',
												'doublescale'
											)}
										</span>
									)}
								</div>
								<div className="flex gap-1 flex-col mt-4">
									<div className="text-[#09090B] text-[16px]">
										{__('Description', 'doublescale')}
									</div>
									<Textarea
										value={event.description || ''}
										onChange={(e) => {
											handleChange(
												'description',
												e.target.value
											);
										}}
										placeholder={__(
											'type your Description',
											'doublescale'
										)}
										rows={4}
										className="rounded-lg"
									/>
								</div>
							</div>
							<div className="flex gap-1 flex-col mt-4">
								<div className="text-[#09090B] text-[16px]">
									{__('Event Color', 'doublescale')}
								</div>
								<div className="flex flex-wrap gap-4 place-items-center mt-2">
									<ColorSelector
										selectedColor={event.color || null}
										onColorSelect={(color) =>
											handleChange('color', color)
										}
									/>
								</div>
							</div>
						</CardContent>
					</Card>
					<div className="flex flex-col gap-5">
						<Card>
							<CardContent>
								<div className="flex flex-col gap-5">
									<div className="flex flex-col gap-2">
										<div className="text-[#09090B] text-[16px]">
											{__(
												'Meeting Duration',
												'doublescale'
											)}
											<span className="text-red-500">
												*
											</span>
										</div>
										<div className="flex gap-5 flex-wrap">
											{durations.map((item) => (
												<Card
													key={item.value}
													className={cn(
														'cursor-pointer transition-all rounded-lg w-[200px]',
														event.duration ==
															item.value
															? 'border-primary bg-secondary'
															: 'border-[#f0f0f0]'
													)}
													onClick={() =>
														handleChange(
															'duration',
															item.value
														)
													}
												>
													<CardContent className="pt-[18px]">
														<div
															className={cn(
																'font-semibold',
																event.duration ==
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
									<div className="flex gap-5 items-center">
										<div className="text-[#09090B] text-[16px]">
											{__(
												'Custom Duration',
												'doublescale'
											)}
										</div>
										<div className="flex items-center h-[48px] w-[194px] rounded-lg border border-input bg-background pr-3 focus-within:ring-2 focus-within:ring-ring">
											<Input
												type="number"
												className="h-full !border-0 !rounded-l-lg !rounded-r-none outline-none shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
												value={event.duration ?? ''}
												onChange={(e) =>
													handleChange(
														'duration',
														e.target.value === ''
															? ''
															: Number(
																e.target
																	.value
															)
													)
												}
											/>
											<span className="pl-3 text-[#71717A]">
												{__('Min', 'doublescale')}
											</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
						{event.type == 'group' && (
							<Card>
								<CardContent>
									<GroupSettings
										maxInvites={
											event.group_settings?.max_invites ??
											2
										}
										showRemaining={
											event.group_settings
												?.show_remaining ?? true
										}
										onChange={(key, value) =>
											handleGroupSettingsChange(
												key,
												value
											)
										}
									/>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			),
		},
		{
			title: __('Setup Location', 'doublescale'),
			content: (
				<Card>
					<CardContent>
						<div className="flex flex-col gap-5">
							<div className="flex justify-between">
								<div className="text-[#09090B] text-[16px]">
									{__('How Will You Meet', 'doublescale')}
									<span className="text-red-500">*</span>
								</div>
								<div className="text-[#848484] italic">
									{__(
										'You Can Select More Than One',
										'doublescale'
									)}
								</div>
							</div>
							<div className="grid grid-cols-2 gap-[15px]">
								<Locations
									locations={event.location || []}
									onChange={(locations) => {
										handleChange('location', locations);
										setValidationErrors((prev) => ({
											...prev,
											location: false,
										}));
									}}
									onKeepDialogOpen={() => setVisible(true)}
									connected_integrations={
										event.connected_integrations!
									}
									calendar={{
										id: calendarId,
										type: calendarType,
									}}
								/>
							</div>
							{validationErrors.location && (
								<span className="text-red-500 text-sm">
									{__(
										'At least one location is required',
										'doublescale'
									)}
								</span>
							)}
						</div>
					</CardContent>
				</Card>
			),
		},
	];

	const continueDisabled =
		loading ||
		(current === 0 && !event.type) ||
		(current === 1 && !event.name);

	const submitDisabled =
		loading || !event.location || event.location.length === 0;

	return (
		<Dialog
			open={visible}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="w-full max-w-[1000px] max-h-[90vh] overflow-y-auto">
				<div className="flex flex-col doublescale-booking-create-event">
					<div className="flex gap-2.5 items-center pb-8">
						<ShareEventIcon />
						<Header
							header={__('Create a new event', 'doublescale')}
							subHeader={__(
								'Add the following data to Create New Event Type.',
								'doublescale'
							)}
						/>
					</div>
					{errorBanner && (
						<NoticeBanner
							notice={errorBanner}
							closeNotice={() => setErrorBanner(null)}
						/>
					)}
					<div className="flex items-center gap-2 mb-6 bg-muted px-6 py-4 rounded-lg">
						{steps.map((item, idx) => (
							<div
								key={item.title}
								className={cn(
									'flex items-center gap-2 text-sm font-medium',
									idx <= current
										? 'text-primary'
										: 'text-muted-foreground'
								)}
							>
								<div
									className={cn(
										'w-6 h-6 rounded-full flex items-center justify-center text-xs',
										idx <= current
											? 'bg-primary text-white'
											: 'bg-muted'
									)}
								>
									{idx + 1}
								</div>
								<span>{item.title}</span>
								{idx < steps.length - 1 && (
									<span className="mx-2 text-muted-foreground/50">
										—
									</span>
								)}
							</div>
						))}
					</div>

					<div className="mb-6">{steps[current].content}</div>

					<div className="flex gap-2.5 items-center justify-end">
						{current > 0 && (
							<Button
								onClick={prev}
								disabled={loading}
								variant="ghost"
								className="bg-muted text-primary text-[16px] px-16 font-semibold rounded-lg border-none"
							>
								{__('Back', 'doublescale')}
							</Button>
						)}
						{current < steps.length - 1 ? (
							<Button
								onClick={next}
								disabled={continueDisabled}
								className={cn(
									'rounded-lg px-12 font-semibold text-[16px] text-white bg-primary border-none transition',
									current === 0 && 'w-full'
								)}
								variant="default"
							>
								{__('Continue', 'doublescale')}
							</Button>
						) : (
							<Button
								onClick={handleSubmit}
								disabled={submitDisabled}
								className="bg-primary px-8 text-white text-[16px] font-semibold rounded-lg border-none"
								variant="default"
							>
								{__('Submit Event', 'doublescale')}
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CreateEvent;
