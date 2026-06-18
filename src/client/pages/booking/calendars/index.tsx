/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Plus as PlusOutlined } from 'lucide-react';
import { filter } from 'lodash';
import { IoEllipsisHorizontal as SlOptions } from 'react-icons/io5';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CalendarResponse, Calendar } from '@/types/booking';
import CalendarEvents from './calendar-events';
import AddCalendarModal from './add-calendar-modal';
import CalendarSkeleton from './shimmer/calendar-skeleton';
import TeamCalendarSkeleton from './shimmer/team-calendar-skeleton';
import { useApi, useNavigate, useCurrentUser } from '@/hooks/booking';
import {
	Header,
	PeopleWhiteIcon,
	ProfileIcon,
	PeopleFillIcon,
	SearchInput,
	HostSelect,
	TabButtons,
	NoticeBanner,
	ShareIcon,
	UpcomingCalendarIcon,
	SettingsIcon,
} from '@/components/booking';
import { ProFeatureNotice } from '@doublescale/components';
import CalendarActions from './calendar-actions';
import HostCalendarIntegrationIcons from './host-calendar-integration-icons';
import CreateEvent from '../create-event';
import ConfigAPI from '@/config/booking';
import { applyFilters } from '@wordpress/hooks';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Main Calendars Component.
 */
const Calendars: React.FC = () => {
	const siteUrl = ConfigAPI.getSiteUrl();
	const { callApi, loading } = useApi();
	const currentUser = useCurrentUser();
	const currentUserId = currentUser.getId();
	const [ calendars, setCalendars ] = useState< Calendar[] | null >( null );
	const [ search, setSearch ] = useState< string >( '' );
	const [ filters, setFilters ] = useState< { [ key: string ]: string } >( {
		type: 'host',
	});
	const [type, setType] = useState<string | null>(null);
	const [update, setUpdate] = useState(false);
	const [showCreateEventModal, setShowCreateEventModal] = useState(false);
	const [selectedCalendarId, setSelectedCalendarId] = useState<
		number | null
	>(null);
	const [selectedUser, setSelectedUser] = useState<number>(
		currentUser.isAdmin() ? 0 : currentUser.getId()
	);
	const [hostSelectKey, setHostSelectKey] = useState<number>(0);
	const [eventStatusMessage, setEventStatusMessage] =
		useState<boolean>(false);
	const [deleteEventMessage, setDeleteEventMessage] =
		useState<boolean>(false);
	const [deleteCalendarMessage, setDeleteCalendarMessage] =
		useState<boolean>(false);
	const [createCalendarMessage, setCreateCalendarMessage] =
		useState<boolean>(false);
	const [cloneMessage, setCloneMessage] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	/** Host calendar id for the logged-in user when it is not in the current `calendars` list (e.g. admin viewing another host). */
	const [ownHostCalendarIdOverride, setOwnHostCalendarIdOverride] = useState<
		number | null
	>(null);
	const navigate = useNavigate();
	const typesLabels = {
		'one-to-one': __('One to One', 'doublescale'),
		group: __('Group', 'doublescale'),
		'round-robin': __('Round Robin', 'doublescale'),
	};
	const canManageAllCalendars = currentUser.hasCapability(
		'doublescale_booking_manage_all_calendars'
	);

	const ownHostCalendarIdFromList =
		calendars?.find(
			(c) =>
				c.type === 'host' &&
				Number( c.user_id ) === Number( currentUserId )
		)?.id ?? null;

	const integrationCalendarId =
		ownHostCalendarIdFromList ?? ownHostCalendarIdOverride;

	const adminViewingOtherHost =
		currentUser.isAdmin() &&
		selectedUser !== 0 &&
		selectedUser !== currentUserId;

	useEffect(() => {
		if (ownHostCalendarIdFromList !== null) {
			setOwnHostCalendarIdOverride(null);
			return;
		}
		if (!calendars || loading || !adminViewingOtherHost) {
			if (!adminViewingOtherHost) {
				setOwnHostCalendarIdOverride(null);
			}
			return;
		}
		let cancelled = false;
		callApi({
			path: addQueryArgs(`calendars`, {
				per_page: 20,
				keyword: '',
				filter: {
					type: 'host',
					user_id: String( currentUserId ),
				},
			}),
			onSuccess: (response: CalendarResponse) => {
				if (cancelled) {
					return;
				}
				const own = (response.data || []).find(
					(c: Calendar) =>
						c.type === 'host' &&
						Number( c.user_id ) === Number( currentUserId )
				);
				setOwnHostCalendarIdOverride(own?.id ?? null);
			},
			onError: () => {
				if (!cancelled) {
					setOwnHostCalendarIdOverride(null);
				}
			},
		});
		return () => {
			cancelled = true;
		};
	}, [
		ownHostCalendarIdFromList,
		adminViewingOtherHost,
		calendars,
		loading,
		currentUserId,
		callApi,
	]);
	// Add useEffect for handling notice timeouts
	useEffect(() => {
		const messages = [
			{
				state: eventStatusMessage,
				setState: setEventStatusMessage as (
					value: boolean | null
				) => void,
			},
			{
				state: deleteEventMessage,
				setState: setDeleteEventMessage as (
					value: boolean | null
				) => void,
			},
			{
				state: deleteCalendarMessage,
				setState: setDeleteCalendarMessage as (
					value: boolean | null
				) => void,
			},
			{
				state: createCalendarMessage,
				setState: setCreateCalendarMessage as (
					value: boolean | null
				) => void,
			},
			{
				state: cloneMessage,
				setState: setCloneMessage as (value: boolean | null) => void,
			},
			{ state: errorMessage, setState: setErrorMessage },
		];

		const cleanupFunctions = messages.map(({ state, setState }) => {
			if (state) {
				const timer = setTimeout(() => {
					setState(null);
				}, 5000); // Hide after 5 seconds
				return () => clearTimeout(timer);
			}
			return undefined;
		});

		return () => {
			cleanupFunctions.forEach((cleanup) => cleanup && cleanup());
		};
	}, [
		eventStatusMessage,
		deleteEventMessage,
		deleteCalendarMessage,
		createCalendarMessage,
		cloneMessage,
		errorMessage,
	]);

	const fetchCalendars = async () => {
		if (loading) return;

		// Build filters for API request
		let apiFilters = {
			...filters,
		};

		// Only add user_id filter if not showing all hosts (for admins only)
		if (
			(selectedUser !== 0 && selectedUser !== null) ||
			!currentUser.isAdmin()
		) {
			// If not admin, always filter by current user ID
			// Make sure selectedUser is not null before calling toString()
			apiFilters.user_id =
				currentUser.isAdmin() && selectedUser !== null
					? selectedUser.toString()
					: currentUser.getId().toString();
		}

		// Special handling for team calendars
		if (filters.type === 'team' && !currentUser.isAdmin()) {
			// For non-admins, we need to fetch team calendars where user is a member
			// This is handled by the backend, but we need to indicate we want team member filtering
			apiFilters.team_member_id = currentUser.getId().toString();
		}

		callApi({
			path: addQueryArgs(`calendars`, {
				per_page: 99,
				keyword: search,
				filters: apiFilters,
			}),
			onSuccess: (response: CalendarResponse) => {
				setCalendars(response.data);
			},
			onError: (error) => {
				setErrorMessage(error);
			},
		});
	};

	const deleteCalendar = async (calendar: Calendar) => {
		try {
			await callApi({
				path: `calendars/${calendar.id}`,
				method: 'DELETE',
				onSuccess: () => {
					const updatedCalendars = filter(
						calendars,
						(c) => c.id !== calendar.id
					);
					setCalendars(updatedCalendars);
				},
				onError: (error) => {
					setErrorMessage(error);
				},
			});
		} catch (error: any) {
			setErrorMessage(error.message || 'Unexpected error occurred');
		}
	};

	// Initial load and whenever dependencies change
	useEffect(() => {
		fetchCalendars();
	}, [search, filters, update, selectedUser]);

	const handleSaved = (calendarType?: string) => {
		// Update host select key to force re-render of the component
		setHostSelectKey((prevKey) => prevKey + 1);

		// Switch to the appropriate tab based on the created calendar type first
		if (calendarType) {
			setFilters({ ...filters, type: calendarType });
		} else {
			// If no calendar type provided, just trigger a refresh
			setUpdate((prev) => !prev);
		}
	};

	const updateEvents = () => {
		setUpdate((prev) => !prev);
	};

	const handleUserChange = (userId: number) => {
		setSelectedUser(userId !== null && userId !== undefined ? userId : 0);
	};

	// Function to filter calendars based on selected filters
	const getFilteredCalendars = () => {
		if (!calendars) return [];

		let filteredCalendars = calendars.filter(
			(calendar) => calendar.type === filters.type
		);

		// For host calendars, apply user filtering if a specific user is selected (not "All")
		const currentSelectedUser =
			selectedUser !== null && selectedUser !== undefined
				? selectedUser
				: 0;

		if (filters.type === 'host' && currentSelectedUser !== 0) {
			filteredCalendars = filteredCalendars.filter(
				(calendar) => calendar.user_id === currentSelectedUser
			);
		}

		return filteredCalendars;
	};

	const handleCreateEvent = (calendarId: number) => {
		setSelectedCalendarId(calendarId);
		setShowCreateEventModal(true);
	};

	const handleCloseCreateEventModal = () => {
		setShowCreateEventModal(false);
		setSelectedCalendarId(null);
	};

	const handleNavigation = (path: string) => {
		navigate(path);
	};

	return (
		<div className="doublescale-booking-calendars">
			<div className="calendars-header pb-5 flex justify-between items-center">
				<Header
					header={__('Calendars', 'doublescale')}
					subHeader={__(
						'Create events to share for people to book on your calendar.',
						'doublescale'
					)}
				/>
				<div className="flex flex-wrap items-center justify-end gap-3">
					{integrationCalendarId !== null && (
						<HostCalendarIntegrationIcons
							calendarId={integrationCalendarId}
							setErrorMessage={setErrorMessage}
						/>
					)}
					{canManageAllCalendars && (
						<Button
							onClick={() => setType('team')}
							variant='default'
							className=""
						>
							<PeopleWhiteIcon />
							<span className="text-white text-[14px] font-[500]">
								{__('Create Team', 'doublescale')}
							</span>
						</Button>
					)}
				</div>
			</div>
			<Card className="doublescale-booking-calendars-action"><CardContent>
				<div className='flex sm:flex-row flex-col justify-between items-center gap-2'>
					<div>
						<Tabs
							value={
								filters.type === 'team' ? 'team' : 'host'
							}
							onValueChange={(tabValue) =>
								setFilters((prev) => ({
									...prev,
									type: tabValue,
								}))
							}
						>
							<TabsList className="gap-2 bg-transparent text-foreground justify-center">
								<TabsTrigger
									value='host'
									disabled={loading}
									className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/70 data-[state=inactive]:hover:text-foreground sm:px-4"
								>
									<ProfileIcon />
									{__('Single Events', 'doublescale')}
								</TabsTrigger>
								<TabsTrigger
									value='team'
									disabled={loading}
									className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/70 data-[state=inactive]:hover:text-foreground sm:px-4"
								>
									<PeopleFillIcon />
									{__('Team Events', 'doublescale')}
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
					<div className='flex flex-col sm:flex-row gap-3'>
						<SearchInput
							placeholder={__('Search Events', 'doublescale')}
							onChange={(e) => setSearch(e.target.value)}
							className="w-[280px]"
						/>
						{filters.type === 'host' && canManageAllCalendars && (
							<HostSelect
								key={hostSelectKey} // Add key to force re-render when changed
								value={selectedUser}
								onChange={handleUserChange}
								placeholder={__(
									'Filter by User',
									'doublescale'
								)}
								defaultValue={
									currentUser.isAdmin()
										? 0
										: currentUser.getId()
								} // Default to All for admins, current user for non-admins
								selectFirstHost={!currentUser.isAdmin()} // Only auto-select first host for non-admins
								showAllOption={currentUser.isAdmin()} // Only show "All" option for admins
							/>
						)}
					</div>
				</div>
			</CardContent></Card>
			{loading || !calendars ? (
				<div>
					{filters.type === 'host' ? (
						<>
							<CalendarSkeleton />
							<CalendarSkeleton />
							<CalendarSkeleton />
						</>
					) : (
						<div className='flex gap-[15px] flex-wrap'>
							<TeamCalendarSkeleton />
							<TeamCalendarSkeleton />
							<TeamCalendarSkeleton />
						</div>
					)}
				</div>
			) : (
				<div>
					{createCalendarMessage && (
						<NoticeBanner
							notice={{
								type: 'success',
								title: __(
									'Successfully Created',
									'doublescale'
								),
								message: __(
									'The Calendar has been created successfully.',
									'doublescale'
								),
							}}
							closeNotice={() =>
								setCreateCalendarMessage(false)
							}
						/>
					)}
					{eventStatusMessage && (
						<NoticeBanner
							notice={{
								type: 'success',
								title: __(
									'Successfully Disabled',
									'doublescale'
								),
								message: __(
									'The Event has been Disabled successfully.',
									'doublescale'
								),
							}}
							closeNotice={() => setEventStatusMessage(false)}
						/>
					)}
					{deleteEventMessage && (
						<NoticeBanner
							notice={{
								type: 'success',
								title: __(
									'Successfully Deleted',
									'doublescale'
								),
								message: __(
									'The Event has been deleted successfully.',
									'doublescale'
								),
							}}
							closeNotice={() => setDeleteEventMessage(false)}
						/>
					)}
					{deleteCalendarMessage && (
						<NoticeBanner
							notice={{
								type: 'success',
								title: __(
									'Successfully Deleted',
									'doublescale'
								),
								message: __(
									'The Calendar has been deleted successfully.',
									'doublescale'
								),
							}}
							closeNotice={() =>
								setDeleteCalendarMessage(false)
							}
						/>
					)}
					{cloneMessage && (
						<NoticeBanner
							notice={{
								type: 'success',
								title: __('Success', 'doublescale'),
								message: __(
									'The Event has been cloned successfully.',
									'doublescale'
								),
							}}
							closeNotice={() => setCloneMessage(false)}
						/>
					)}
					{errorMessage && (
						<NoticeBanner
							notice={{
								type: 'error',
								title: __('Error', 'doublescale'),
								message: errorMessage,
							}}
							closeNotice={() => setErrorMessage(null)}
						/>
					)}
					{getFilteredCalendars().length === 0 ? (
						<div className='flex flex-col gap-[30px] justify-center items-center py-10'>
							<div className="border rounded-full p-7 bg-[#F4F5FA] border-[#E1E2E9] text-[#BEC0CA]">
								<UpcomingCalendarIcon
									width={60}
									height={60}
								/>
							</div>
							<div className='flex flex-col gap-[5px] justify-center items-center'>
								<span className="text-[20px] font-medium text-black">
									{search
										? __(
											'No matching events found',
											'doublescale'
										)
										: __(
											'No Calendars available',
											'doublescale'
										)}
								</span>
								{filters.type === 'team' && canManageAllCalendars && (
									<Button className="mt-4" onClick={() => setType('team')} variant='default'>{<PlusOutlined />}
										{__(
											'Create Team Calendar',
											'doublescale'
										)}
									</Button>
								)}
								{filters.type === 'host' && (
									<p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
										{__(
											'Host calendars are auto-provisioned for CRM team members. Add a user under Settings → Team to create their host calendar.',
											'doublescale'
										)}
									</p>
								)}
							</div>
						</div>
					) : (
						<>
							{filters.type === 'host' ? (
								<>
									{getFilteredCalendars().map(
										(calendar) => (
											<Card
												key={calendar.id}
												className="bg-[#FDFDFD] w-full mb-4"
											><CardContent>
													<div className='flex flex-col gap-5'>
														<Card className="bg-white"><CardContent>
															<div className='flex justify-between items-center'>
																<div className='flex flex-col'>
																	<div className="text-[#313131] text-base font-semibold">
																		{
																			calendar.name
																		}
																	</div>
																	<a
																		href={
																			siteUrl +
																			'?doublescale_booking_calendar=' +
																			calendar.slug
																		}
																		target="_blank"
																	>
																		<div className="text-primary flex items-center gap-2 italic text-xs font-medium cursor-pointer">
																			{__(
																				'View My Landing Page',
																				'doublescale'
																			)}
																			<ShareIcon
																				width={
																					16
																				}
																				height={
																					16
																				}
																			/>
																		</div>
																	</a>
																</div>
																<div className='flex flex-wrap items-center justify-end gap-2'>
																	<Button
																		className="border-[#EDEBEB] text-color-primary-text flex items-center gap-2"
																		onClick={() =>
																			navigate(
																				`booking/calendars/${calendar.id}`
																			)
																		}
																		variant='ghost'
																	>
																		<SettingsIcon
																			width={
																				18
																			}
																			height={
																				18
																			}
																		/>
																		{__(
																			'Host Settings',
																			'doublescale'
																		)}
																	</Button>
																	<CalendarActions
																		calendar={calendar}
																		setCloneMessage={
																			setCloneMessage
																		}
																		onSaved={
																			handleSaved
																		}
																		onEdit={(
																			id
																		) =>
																			navigate(
																				`booking/calendars/${id}`
																			)
																		}
																		onDelete={(
																			id
																		) =>
																			deleteCalendar(
																				{
																					id: id,
																				} as Calendar
																			)
																		}
																		setDeleteCalendarMessage={
																			setDeleteCalendarMessage
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
																					'Calendar actions',
																					'doublescale'
																				)}
																			>
																				<SlOptions className="text-color-primary-text text-[18px]" />
																			</Button>
																		}
																	/>
																</div>
															</div>
														</CardContent></Card>
														<CalendarEvents
															navigate={navigate}
															calendar={calendar}
															typesLabels={
																typesLabels
															}
															updateCalendarEvents={
																updateEvents
															}
															setStatusMessage={
																setEventStatusMessage
															}
															setDeleteMessage={
																setDeleteEventMessage
															}
															setCloneMessage={
																setCloneMessage
															}
															setErrorMessage={
																setErrorMessage
															}
															onCreateEvent={
																handleCreateEvent
															}
														/>
													</div>
												</CardContent></Card>
										)
									)}
								</>
							) : (
								applyFilters(
									'doublescale_booking_calendars_team_events',
									<ProFeatureNotice
										featureName={__(
											'Team Events',
											'doublescale'
										)}
										description={__(
											'Coordinate group bookings with round-robin and collective scheduling. Assign multiple hosts to a single event and let attendees book time that works for the whole team.',
											'doublescale'
										)}
										features={[
											__(
												'Round-robin host assignment',
												'doublescale'
											),
											__(
												'Collective team availability',
												'doublescale'
											),
											__(
												'Shared team calendars',
												'doublescale'
											),
										]}
									/>,
									{
										getFilteredCalendars,
										siteUrl,
										setCloneMessage,
										handleSaved,
										navigate: handleNavigation,
										deleteCalendar,
										setDeleteCalendarMessage,
										setErrorMessage,
										filters,
										handleCreateEvent,
										typesLabels,
										updateEvents,
										setEventStatusMessage,
										setDeleteEventMessage,
									}
								)
							)}
						</>
					)}
				</div>
			)}
			{type && (
				<AddCalendarModal
					open={!!type}
					onClose={() => setType(null)}
					onSaved={handleSaved}
					setCreateCalendarMessage={setCreateCalendarMessage}
					setErrorMessage={setErrorMessage}
				/>
			)}
			{showCreateEventModal && selectedCalendarId && (
				<CreateEvent
					visible={showCreateEventModal}
					setVisible={setShowCreateEventModal}
					onClose={handleCloseCreateEventModal}
					calendarId={selectedCalendarId}
					calendarType={filters.type}
				/>
			)}
		</div>
	);
};

export default Calendars;
