/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

import { IoCloseSharp } from 'react-icons/io5';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Calendar as CalendarType } from '@/types/booking';
import {
	useApi,
	useNotice,
	useBreadcrumbs,
	useNavigate,
} from '@/hooks/booking';
import { getCurrentTimezone } from '@/utils/booking';
import { useParams } from '@doublescale/navigation';
import { Provider } from './state/context';
import { GeneralSettings } from './tabs';
import { ShareIcon } from '@/components/booking';
import { NoticeBanner } from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export const UnifiedShimmerLoader = () => (
	<div className="space-y-6 w-full">
		<Card className="p-6"><CardContent>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Skeleton className='h-4 w-full' />
                        <div className="mt-4">
                            <Skeleton className='h-4 w-full' />
                        </div>
                    </div>
                    <div>
                        <Skeleton className='h-4 w-full' />
                    </div>
                </div>
            </CardContent></Card>
	</div>
);

/**
 * Main Calendars Component.
 */
const Calendar: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const { callApi, loading } = useApi();
	const { errorNotice } = useNotice();
	const [calendar, setCalendar] = useState<CalendarType | null>(null);
	const [originalCalendar, setOriginalCalendar] =
		useState<CalendarType | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [saveDisabled, setSaveDisabled] = useState(true);
	const [open, setOpen] = useState(!!id);
	const [showSavedBanner, setShowSavedBanner] = useState(false);
	const [showErrorBanner, setShowErrorBanner] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const navigate = useNavigate();
	const setBreadcrumbs = useBreadcrumbs();

	// Remote calendar / conferencing is managed from Calendars list (per host).
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('tab') !== 'integrations') {
			return;
		}
		urlParams.delete('tab');
		urlParams.delete('subtab');
		const qs = urlParams.toString();
		const newUrl = qs
			? `${window.location.pathname}?${qs}`
			: window.location.pathname;
		window.history.replaceState({}, '', newUrl);
	}, [calendar?.id]);

	// Add effect to update saveDisabled based on changes
	useEffect(() => {
		if (!calendar || !originalCalendar) {
			setSaveDisabled(true);
			return;
		}

		// Check if required fields are present
		const hasRequiredFields =
			calendar.name &&
			calendar.timezone &&
			(calendar.type !== 'team' || (calendar.team_members?.length ?? 0) > 0);

		// Check if any changes were made by comparing with original data
		const hasChanges =
			JSON.stringify(calendar) !== JSON.stringify(originalCalendar);

		setSaveDisabled(!hasRequiredFields || !hasChanges);
	}, [calendar, originalCalendar]);

	const fetchCalendar = async () => {
		setIsLoading(true);
		callApi({
			path: `calendars/${id}`,
			method: 'GET',
			onSuccess(response) {
				// Legacy host calendars (provisioned before timezone backfill, or
				// migrated from older builds) can come back with `timezone: null`.
				// `TimezoneSelect` already displays the browser timezone as a
				// visual fallback, but the underlying state stays null — which
				// keeps the Save button disabled forever because of the
				// `calendar.name && calendar.timezone` required-fields check
				// below. Mirror the visual fallback into both `calendar` and
				// `originalCalendar` so the form starts clean (not dirty) and
				// edits to other fields can flip Save on as expected.
				const normalized: CalendarType = {
					...response,
					timezone:
						response.timezone || getCurrentTimezone(),
				};
				setCalendar(normalized);
				setOriginalCalendar(normalized);
				setBreadcrumbs([
					{
						path: `calendars/${id}`,
						title: response.name,
					},
				]);
				setIsLoading(false);
			},
			onError(error) {
				errorNotice(error.message);
				setIsLoading(false);
			},
		});
	};

	useEffect(() => {
		if (!id) {
			return;
		}
		fetchCalendar();
	}, [id]);

	const handleClose = () => {
		setOpen(false);
		navigate('booking/calendars');
	};

	const saveSettings = async () => {
		try {
			if (!calendar) return;

			// Validate
			if (!calendar.name) {
				setErrorMessage(
					__('Please enter a name for the calendar.', 'doublescale')
				);
				setShowErrorBanner(true);
				setTimeout(() => setShowErrorBanner(false), 5000);
				return;
			}

			if (!calendar.timezone) {
				setErrorMessage(
					__('Please select a timezone.', 'doublescale')
				);
				setShowErrorBanner(true);
				setTimeout(() => setShowErrorBanner(false), 5000);
				return;
			}

			if (
				calendar.type === 'team' &&
				(calendar.team_members?.length ?? 0) === 0
			) {
				setErrorMessage(
					__('A team calendar must have at least one member.', 'doublescale')
				);
				setShowErrorBanner(true);
				setTimeout(() => setShowErrorBanner(false), 5000);
				return;
			}

			try {
				// `team_members` is what the GET response surfaces; the PUT
				// endpoint reads the roster from `members` (mirrors the create
				// contract). Translate at the boundary for team calendars.
				const payload =
					calendar.type === 'team'
						? { ...calendar, members: calendar.team_members ?? [] }
						: calendar;

				// Save settings
				await callApi({
					path: `calendars/${id}`,
					method: 'PUT',
					data: payload,
					onSuccess: () => {
						setShowSavedBanner(true);
						setTimeout(() => setShowSavedBanner(false), 5000);
						setSaveDisabled(true);
						setOriginalCalendar(calendar);
					},
					onError: (error) => {
						setErrorMessage(
							error || __('Failed to save settings.', 'doublescale')
						);
						setShowErrorBanner(true);
						setTimeout(() => setShowErrorBanner(false), 5000);
						setSaveDisabled(false);
					},
				});
			} catch (apiError) {
				console.error('API call failed:', apiError);
				setErrorMessage(
					__(
						'An unexpected error occurred during the API call.',
						'doublescale'
					)
				);
				setShowErrorBanner(true);
				setTimeout(() => setShowErrorBanner(false), 5000);
				setSaveDisabled(false);
			}
		} catch (error) {
			console.error('Unexpected error in saveSettings:', error);
			setErrorMessage(
				__(
					'An unexpected error occurred while saving settings.',
					'doublescale'
				)
			);
			setShowErrorBanner(true);
			setTimeout(() => setShowErrorBanner(false), 5000);
			setSaveDisabled(false);
		}
	};
	if (!id) {
		return null;
	}
	return (
        <Provider
			value={{
				state: calendar,
				actions: {
					setCalendar,
				},
			}}
		>
            <Dialog
                open={open}
                onOpenChange={open => {
                    if (!open)
                        handleClose();
                }}><DialogContent
                    hideCloseButton
                    className='fixed inset-0 max-w-none w-full h-full translate-x-0 translate-y-0 left-0 top-0 rounded-none p-0 z-[150201] overflow-y-auto overflow-x-hidden min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-0'>
                    <div className="border-b px-4 py-2 overflow-x-hidden">
                        <div className='flex flex-col gap-3 max-[768px]:gap-3 md:flex-row md:justify-between md:items-center'>
                            <div className='flex gap-2.5 items-center min-w-0'>
                                <button
                                    type="button"
                                    className="shrink-0 cursor-pointer bg-transparent border-0 text-primary"
                                    onClick={handleClose}
                                    aria-label={__('Close', 'doublescale')}
                                >
                                    <IoCloseSharp/>
                                </button>
                                <div className="min-w-0 text-[#09090B] text-[24px] font-[500] max-[768px]:text-xl">
                                    {__('Calendar Settings', 'doublescale')}
                                </div>
                            </div>
                            <div className='flex w-full md:w-auto gap-3 md:gap-5 justify-between items-center'>
                                <Button className="shrink-0 p-0" variant='ghost'>{<ShareIcon />}
                                    {__('View', 'doublescale')}
                                </Button>
                                <Button
                                    onClick={saveSettings}
                                    disabled={saveDisabled}
                                    className="shrink-0 border-none shadow-none "
                                    variant='default'>
                                    {__('Save Setting Changes', 'doublescale')}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="doublescale-booking-event min-w-0 overflow-x-hidden">
                        <div className="px-4 py-5 md:px-20">
                            {isLoading ? (
                                <UnifiedShimmerLoader />
                            ) : (
                                <>
                                    {showSavedBanner && (
                                        <NoticeBanner
                                            notice={{
                                                type: 'success',
                                                title: __(
                                                    'Successfully Updated',
                                                    'doublescale'
                                                ),
                                                message: __(
                                                    'The Calendar settings have been updated successfully.',
                                                    'doublescale'
                                                ),
                                            }}
                                            closeNotice={() =>
                                                setShowSavedBanner(false)
                                            }
                                        />
                                    )}
                                    {showErrorBanner && (
                                        <NoticeBanner
                                            notice={{
                                                type: 'error',
                                                title: __('Error', 'doublescale'),
                                                message: errorMessage,
                                            }}
                                            closeNotice={() =>
                                                setShowErrorBanner(false)
                                            }
                                        />
                                    )}
                                    <GeneralSettings />
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent></Dialog>
        </Provider>
    );
};

export default Calendar;
