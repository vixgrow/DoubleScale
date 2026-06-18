/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';

import { IoCloseSharp } from 'react-icons/io5';
import { useLocation } from 'react-router-dom';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Event as EventType } from '@/types/booking';
import ConfigAPI from '@/config/booking';
import {
	useApi,
	useNotice,
	useBreadcrumbs,
	useNavigate,
	useEvent,
} from '@/hooks/booking';
import { useParams } from '@doublescale/navigation';
import {
	AvailabilityIcon,
	CalendarsIcon,
	EmailNotiIcon,
	OutlinedClockIcon,
	PaymentSettingsIcon,
	QuestionIcon,
	SettingsIcon,
	ShareIcon,
	SmsNotiIcon,
	TrashRedIcon,
	ShareModal,
	NoticeBanner,
} from '@/components/booking';
import Calendar from '../calendar';
import {
	EventDetails,
	AdvancedSettings,
	Payments,
	EmailNotificationTab,
	SmsNotificationTab,
	AvailabilityLimits,
} from './tabs';
import EventFieldsTab, {
	FieldsProUpsellOverlay,
} from './tabs/fields';
import WaitingListSettings from './tabs/waiting-list';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface NoticeType {
	title: string;
	message: string;
	type?: 'success' | 'error';
}

const Event: React.FC = () => {
	const {
		id: calendarId,
		eventId: id,
		tab,
	} = useParams<{ id: string; eventId: string; tab: string }>();

	// All hooks MUST be called before any conditional return, per React's
	// Rules of Hooks. Previously the !id?.match(...) early return below was
	// above these hooks, which changed the call order between renders and
	// could trigger "Rendered fewer hooks than expected" errors.
	const childRef = useRef<any>(null);
	const siteUrl = ConfigAPI.getSiteUrl();
	const { callApi } = useApi();
	const { errorNotice, successNotice } = useNotice();

	// Use event store instead of local state
	const {
		currentEvent: event,
		setEvent,
		clearEvent,
		loading: eventLoading,
		error: eventError,
	} = useEvent();

	const [open, setOpen] = useState(!!id);
	const [modalShareId, setModalShareId] = useState<string | null>(null);
	const [fieldsUpsellOpen, setFieldsUpsellOpen] = useState(false);
	const [saveDisabled, setSaveDisabled] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const location = useLocation();
	const [notice, setNotice] = useState<NoticeType | null>(null);
	const [isEventDisabled, setIsEventDisabled] = useState(
		event?.is_disabled || false
	);
	const [isSwitchLoading, setIsSwitchLoading] = useState(false);
	const [activeTab, setActiveTab] = useState(tab || 'details');
	const [showSavedBanner, setShowSavedBanner] = useState(false);
	const [showErrorBanner, setShowErrorBanner] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [showStatusBanner, setShowStatusBanner] = useState(false);
	const [statusMessage, setStatusMessage] = useState<{
		title: string;
		message: string;
		type: 'success' | 'error';
	}>({ title: '', message: '', type: 'success' });

	useEffect(() => {
		if (location.state?.notice) {
			setNotice(location.state.notice);
			window.history.replaceState({}, document.title);
		}
	}, [location.state]);

	useEffect(() => {
		if (event) {
			setIsEventDisabled(event.is_disabled || false);
		}
	}, [event]);

	const navigate = useNavigate();
	const setBreadcrumbs = useBreadcrumbs();

	// Guards moved AFTER all hooks. An invalid or missing eventId means
	// the user navigated to /booking/calendars/:id/events/junk — fall back
	// to the calendar view instead of rendering an empty event editor.
	if (!id?.match(/^\d+$/)) {
		return <Calendar />;
	}

	if (!id) {
		return null;
	}

	const fetchEvent = async () => {
		callApi({
			path: `events/${id}`,
			method: 'GET',
			onSuccess(response: EventType) {
				// Update event store instead of local state
				setEvent(response);
				setBreadcrumbs([
					{
						path: `calendars/${calendarId}`,
						title: response.calendar.name,
					},
					{
						path: `calendars/${calendarId}/${id}`,
						title: response.name,
					},
				]);
			},
			onError(error) {
				errorNotice(error.message);
			},
		});
	};

	useEffect(() => {
		fetchEvent();

		// Cleanup: Clear event when component unmounts
		return () => {
			clearEvent();
		};
	}, []);

	// Handle event store errors
	useEffect(() => {
		if (eventError) {
			errorNotice(eventError);
		}
	}, [eventError, errorNotice]);

	useEffect(() => {
		const handleTabClose = (event: BeforeUnloadEvent) => {
			if (saveDisabled) {
				return;
			}
			// If discardChanges returns false (meaning changes are unsaved),
			// then we want to prompt the user before reloading/closing.
			if (!discardChanges()) {
				event.preventDefault();
				// Setting returnValue triggers the browser's confirmation dialog.
				event.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handleTabClose);

		return () => {
			window.removeEventListener('beforeunload', handleTabClose);
		};
	}, [saveDisabled]);

	const handleDeleteEvent = () => {
		if (!event?.id) return;

		if (
			!window.confirm(
				__(
					'Are you sure you want to delete this event?',
					'doublescale'
				)
			)
		) {
			return; // Exit if the user cancels
		}

		callApi({
			path: `events/${event.id}`,
			method: 'DELETE',
			onSuccess: () => {
				successNotice(__('Event deleted successfully', 'doublescale'));

				// Clear event from store
				clearEvent();
				setOpen(false);
				navigate('booking/calendars'); // Redirect after deletion
			},
			onError: (error: string) => {
				errorNotice(error);
			},
		});
	};

	const toggleEventStatus = async () => {
		if (!event?.id || isSwitchLoading) return;

		const newStatus = !isEventDisabled;
		setIsSwitchLoading(true);
		setShowStatusBanner(false);

		try {
			await callApi({
				path: `events/${event.id}/disable-status`,
				method: 'PUT',
				data: {
					status: newStatus,
				},
			});

			const title = newStatus
				? __('Event Disabled', 'doublescale')
				: __('Event Enabled', 'doublescale');
			const message = newStatus
				? __('Event has been disabled successfully.', 'doublescale')
				: __('Event has been enabled successfully.', 'doublescale');

			// Use existing useNotice hook
			successNotice(`${title}: ${message}`);

			setStatusMessage({
				title,
				message,
				type: 'success',
			});
			setShowStatusBanner(true);
			setTimeout(() => setShowStatusBanner(false), 5000);

			// Update event in store
			const updatedEvent = { ...event, is_disabled: newStatus };
			setEvent(updatedEvent);
			setIsEventDisabled(newStatus);
		} catch (error: unknown) {
			const errorMsg =
				error instanceof Error
					? error.message
					: __(
							'Failed to update event status. Please try again.',
							'doublescale'
						);

			// Use existing useNotice hook
			errorNotice(errorMsg);

			setStatusMessage({
				title: __('Status Update Failed', 'doublescale'),
				message: errorMsg,
				type: 'error',
			});
			setShowStatusBanner(true);
			setTimeout(() => setShowStatusBanner(false), 5000);
		} finally {
			setIsSwitchLoading(false);
		}
	};

	const handleClose = () => {
		if (discardChanges()) {
			setOpen(false);
			// Clear event from store when closing
			clearEvent();
			navigate('booking/calendars');
		}
	};

	const handleSave = async () => {
		if (!childRef.current || isSaving) return; // Prevent multiple clicks

		setIsSaving(true); // Disable button immediately
		setShowErrorBanner(false); // Reset error state

		try {
			await childRef.current.saveSettings(); // Wait for save to complete

			// Use existing useNotice hook
			successNotice(
				__('Your changes have been saved successfully.', 'doublescale')
			);

			setShowSavedBanner(true);
			setTimeout(() => setShowSavedBanner(false), 5000);
		} catch (error: unknown) {
			const errorMsg =
				error instanceof Error
					? error.message
					: __(
							'Failed to save changes. Please try again.',
							'doublescale'
						);

			// Use existing useNotice hook
			errorNotice(errorMsg);

			setErrorMessage(errorMsg);
			setShowErrorBanner(true);
			setTimeout(() => setShowErrorBanner(false), 5000);
		} finally {
			setIsSaving(false); // Re-enable button
		}
	};

	const handleNavigation = (path: string) => {
		navigate(path);
	};

	const tabs = [
		{
			key: 'details',
			label: __('Event Details', 'doublescale'),
			children: (
				<EventDetails
					onKeepDialogOpen={() => setOpen(true)}
					ref={childRef}
					setDisabled={setSaveDisabled}
					notice={notice}
					clearNotice={() => setNotice(null)}
				/>
			),
			icon: <CalendarsIcon />,
		},
		{
			key: 'availability',
			label: __('Availability & Limits', 'doublescale'),
			children: (
				<AvailabilityLimits
					ref={childRef}
					setDisabled={setSaveDisabled}
					disabled={saveDisabled}
				/>
			),
			icon: <AvailabilityIcon />,
		},
		{
			key: 'question',
			label: __('Questions', 'doublescale'),
			children: (
				<EventFieldsTab
					ref={childRef}
					disabled={saveDisabled}
					setDisabled={setSaveDisabled}
					onOpenFieldsUpsell={() => setFieldsUpsellOpen(true)}
				/>
			),
			icon: <QuestionIcon />,
		},
		{
			key: 'email-notifications',
			label: __('Email Notification', 'doublescale'),
			children: (
				<EmailNotificationTab
					ref={childRef}
					disabled={saveDisabled}
					setDisabled={setSaveDisabled}
				/>
			),
			icon: <EmailNotiIcon />,
		},
		{
			key: 'sms-notifications',
			label: __('SMS Notification', 'doublescale'),
			children: (
				<SmsNotificationTab
					ref={childRef}
					disabled={saveDisabled}
					setDisabled={setSaveDisabled}
					handleNavigation={handleNavigation}
				/>
			),
			icon: <SmsNotiIcon />,
		},
		{
			key: 'advanced-settings',
			label: __('Advanced Settings', 'doublescale'),
			children: (
				<AdvancedSettings
					ref={childRef}
					disabled={saveDisabled}
					setDisabled={setSaveDisabled}
				/>
			),
			icon: <SettingsIcon />,
		},
		{
			key: 'payment-settings',
			label: __('Payments', 'doublescale'),
			children: (
				<Payments
					ref={childRef}
					disabled={saveDisabled}
					setDisabled={setSaveDisabled}
				/>
			),
			icon: <PaymentSettingsIcon />,
		},
		{
			key: 'waiting-list',
			label: __('Waiting List', 'doublescale'),
			children: (
				<WaitingListSettings
					ref={childRef}
					disabled={saveDisabled}
					setDisabled={setSaveDisabled}
				/>
			),
			icon: <OutlinedClockIcon />,
		},
	];

	useEffect(() => {
		if (tab) {
			setActiveTab(tab);
		}
	}, [tab]);

	const discardChanges = (): boolean => {
		if (saveDisabled) {
			return true;
		}

		const confirmed = window.confirm(
			__(
				'You have unsaved changes. Switching tabs will discard them. Do you want to continue?',
				'doublescale'
			)
		);

		if (confirmed) {
			return true;
		}

		return false;
	};

	const allowStackedOverlayInteraction = (target: EventTarget | null) => {
		const el = target as HTMLElement | null;
		if (!el) {
			return false;
		}
		if (el.closest('[data-doublescale-stacked-overlay]')) {
			return true;
		}
		const nestedDialog = el.closest('[data-radix-dialog-content]');
		return (
			!!nestedDialog &&
			!nestedDialog.classList.contains('doublescale-event-setup-dialog')
		);
	};

	const eventDialogOutsideProps = {
		onPointerDownOutside: (e: {
			target: EventTarget | null;
			preventDefault: () => void;
		}) => {
			if (allowStackedOverlayInteraction(e.target)) {
				e.preventDefault();
			}
		},
		onInteractOutside: (e: {
			target: EventTarget | null;
			preventDefault: () => void;
		}) => {
			if (allowStackedOverlayInteraction(e.target)) {
				e.preventDefault();
			}
		},
		onFocusOutside: (e: {
			target: EventTarget | null;
			preventDefault: () => void;
		}) => {
			if (allowStackedOverlayInteraction(e.target)) {
				e.preventDefault();
			}
		},
	};

	const handleTabChange = (newValue: string) => {
		if (!calendarId || !id) {
			console.error('Missing calendar ID or event ID');
			return;
		}

		if (discardChanges()) {
			setSaveDisabled(true);
			setShowErrorBanner(false);
			setShowSavedBanner(false);
			setActiveTab(newValue);
		}
	};

	// Show loading state from event store
	if (eventLoading) {
		return (
            <Dialog open={true}><DialogContent
                    hideCloseButton
                    className='doublescale-event-setup-dialog fixed inset-0 max-w-none w-full h-full translate-x-0 translate-y-0 left-0 top-0 rounded-none p-0 z-[150201] overflow-y-auto overflow-x-hidden min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-0'
                    {...eventDialogOutsideProps}>
                    <div className="flex items-center justify-center h-full">
                        <div>Loading event...</div>
                    </div>
                </DialogContent></Dialog>
        );
	}

	return (
        <>
        <Dialog
            open={open}
            onOpenChange={open => {
                if (!open)
                    handleClose();
            }}><DialogContent
                hideCloseButton
                className='doublescale-event-setup-dialog fixed inset-0 max-w-none w-full h-full translate-x-0 translate-y-0 left-0 top-0 rounded-none p-0 z-[150201] overflow-y-auto overflow-x-hidden min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-0'
                {...eventDialogOutsideProps}>
                <div className="border-b px-4 py-2 overflow-x-hidden">
                    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                        <div className="flex w-full md:w-auto items-center justify-between gap-3 md:justify-start">
                            <div className="flex gap-2.5 items-center min-w-0">
                                <button
                                    type="button"
                                    className="shrink-0 cursor-pointer bg-transparent border-0 text-primary"
                                    onClick={handleClose}
                                    aria-label={__('Close', 'doublescale')}
                                >
                                    <IoCloseSharp />
                                </button>
                                <div className="min-w-0 text-[#09090B] text-[24px] font-[500] max-[768px]:text-xl">
                                    {__('Event Setup', 'doublescale')}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-3 md:hidden">
                                <Switch
                                    checked={!isEventDisabled}
                                    onCheckedChange={toggleEventStatus}
                                    disabled={isSwitchLoading}
                                    className={
                                        !isEventDisabled
                                            ? 'bg-primary'
                                            : 'bg-gray-400'
                                    } />
                                <button
                                    type="button"
                                    className="cursor-pointer bg-transparent border-0 shrink-0"
                                    onClick={handleDeleteEvent}
                                    aria-label={__('Delete event', 'doublescale')}
                                >
                                    <TrashRedIcon />
                                </button>
                                <Button
                                    style={{ paddingLeft: 0, paddingRight: 0 }}
                                    onClick={() => setModalShareId(id)}
                                    className="shrink-0"
                                    variant="ghost"
                                >
                                    <ShareIcon />
                                </Button>
                            </div>
                        </div>
                        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:gap-6">
                            <div className="hidden md:flex items-center gap-4">
                                <Switch
                                    checked={!isEventDisabled}
                                    onCheckedChange={toggleEventStatus}
                                    disabled={isSwitchLoading}
                                    className={
                                        !isEventDisabled
                                            ? 'bg-primary'
                                            : 'bg-gray-400'
                                    } />
                                <button
                                    type="button"
                                    className="cursor-pointer bg-transparent border-0 shrink-0"
                                    onClick={handleDeleteEvent}
                                    aria-label={__('Delete event', 'doublescale')}
                                >
                                    <TrashRedIcon />
                                </button>
                                <Button
                                    style={{ paddingLeft: 0, paddingRight: 0 }}
                                    onClick={() => setModalShareId(id)}
                                    className="shrink-0"
                                    variant="ghost"
                                >
                                    <ShareIcon />
                                    {__('Share', 'doublescale')}
                                </Button>
                            </div>
                            {modalShareId !== null && (
                                <ShareModal
                                    event={event as EventType}
                                    open={modalShareId !== null}
                                    onClose={() => setModalShareId(null)}
                                    url={`${siteUrl}?doublescale_booking_event=${event?.slug}`}
                                />
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={saveDisabled || isSaving}
                                className={`rounded-lg font-[500] text-white w-full md:w-auto max-[768px]:px-4 ${
                                    saveDisabled || isSaving
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-primary '
                                }`}
                                variant="default"
                            >
                                {__('Save Changes', 'doublescale')}
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="doublescale-booking-event min-w-0 overflow-x-hidden">
                    <div
                        className="min-w-0 overflow-x-auto hide-scrollbar px-4 py-5"
                        style={{ backgroundColor: '#FBFBFB' }}
                    >
                        <div className="flex w-max min-w-full flex-nowrap gap-1 items-center">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl capitalize font-bold transition-all px-4 py-2 min-h-[48px] h-12 mx-0.5 cursor-pointer border-0 ${
                                        activeTab === tab.key
                                            ? 'bg-primary text-white'
                                            : 'bg-transparent text-[#292D32]'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-5 max-[768px]:p-4 min-w-0">
                        {showSavedBanner && (
                            <div className="px-9">
                                <NoticeBanner
                                    notice={{
                                        type: 'success',
                                        title: __(
                                            'Successfully Saved',
                                            'doublescale'
                                        ),
                                        message: __(
                                            'Your changes have been saved successfully.',
                                            'doublescale'
                                        ),
                                    }}
                                    closeNotice={() => setShowSavedBanner(false)}
                                />
                            </div>
                        )}
                        {showErrorBanner && (
                            <div className="px-9">
                                <NoticeBanner
                                    notice={{
                                        type: 'error',
                                        title: __('Save Failed', 'doublescale'),
                                        message: errorMessage,
                                    }}
                                    closeNotice={() => setShowErrorBanner(false)}
                                />
                            </div>
                        )}
                        {showStatusBanner && (
                            <div className="px-9">
                                <NoticeBanner
                                    notice={{
                                        type: statusMessage.type,
                                        title: statusMessage.title,
                                        message: statusMessage.message,
                                    }}
                                    closeNotice={() => setShowStatusBanner(false)}
                                />
                            </div>
                        )}
                        {tabs.find((t) => t.key === activeTab)?.children || (
                            <p>No content available</p>
                        )}
                    </div>
                </div>
            </DialogContent></Dialog>
        <FieldsProUpsellOverlay
            open={fieldsUpsellOpen}
            onClose={() => setFieldsUpsellOpen(false)}
        />
        </>
    );
};

export default Event;
