/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

import { IoCloseSharp } from 'react-icons/io5';

/**
 * Internal dependencies
 */
import { useParams } from '@doublescale/navigation';
import { useApi, useNavigate } from '@/hooks/booking';
import type {
	Availability,
	AvailabilityValue,
	DateOverrides,
	NoticeMessage,
} from '@/types/booking';
import {
	NoticeBanner,
	Schedule,
	SelectTimezone,
} from '@/components/booking';
import { OverrideSection } from '@/components/booking';
import InfoComponent from './info';
import { isValidDateOverrides } from '@/utils/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/**
 * Main Calendars Component.
 */

// Create a type that ensures value is always present during editing
type AvailabilityWithValue = Omit<
	Availability,
	'id' | 'user_id' | 'created_at' | 'updated_at'
> & {
	id?: number;
	user_id?: number;
	created_at?: string;
	updated_at?: string;
	value: AvailabilityValue; // This ensures value is never undefined
};

const AvailabilityDetails: React.FC = () => {
	const [availabilityDetails, setAvailabilityDetails] =
		useState<AvailabilityWithValue>({
			value: {
				weekly_hours: {},
				override: {},
			},
			name: '',
			timezone: '',
			is_default: false,
		});
	const [availabilityName, setAvailabilityName] = useState<string>('');
	const [availabilityTimezone, setAvailabilityTimezone] =
		useState<string>('');
	const [isDefault, setIsDefault] = useState<boolean>(false);
	const [dateOverrides, setDateOverrides] = useState<DateOverrides | {}>({});
	const [initialLoading, setInitialLoading] = useState<boolean>(true);
	const [savingChanges, setSavingChanges] = useState<boolean>(false);
	const [isSaveBtnDisabled, setIsSaveBtnDisabled] = useState<boolean>(true);
	const [showNotice, setShowNotice] = useState<boolean>(false);
	const [noticeMessage, setNoticeMessage] = useState<NoticeMessage>({
		type: 'success',
		title: __('Success', 'doublescale'),
		message: __('Availability updated successfully', 'doublescale'),
	});
	const [startDay, setStartDay] = useState<string>('monday');
	const [timeFormat, setTimeFormat] = useState<string>('12');

	const { callApi } = useApi();
	const navigate = useNavigate();

	const fetchAvailabilityDetails = () => {
		setInitialLoading(true);
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'GET',
			onSuccess: (data: Availability) => {
				setAvailabilityDetails(data);
				setAvailabilityName(data.name);
				setAvailabilityTimezone(data.timezone);
				setDateOverrides(data.value.override);
				setIsDefault(data.is_default ?? false);
				setInitialLoading(false);
			},
			onError: () => {
				setNoticeMessage({
					type: 'error',
					title: __('Error', 'doublescale'),
					message: __(
						'Failed to load availabilities',
						'doublescale'
					),
				});
				setShowNotice(true);
				setInitialLoading(false);
			},
		});
	};

	// const { callApi } = useApi();
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
		fetchGlobalSettings();
		fetchAvailabilityDetails();
	}, []);

	useEffect(() => {
		// Show success notice if redirected from creation
		const showSuccessNotice = sessionStorage.getItem(
			'showNewScheduleNotice'
		);
		if (showSuccessNotice) {
			setNoticeMessage({
				type: 'success',
				title: __('Success', 'doublescale'),
				message: __(
					'New availability schedule created successfully',
					'doublescale'
				),
			});
			setShowNotice(true);
			sessionStorage.removeItem('showNewScheduleNotice');
		}
	}, []);

	const { id: availabilityId } = useParams<{ id: string }>();
	if (!availabilityId) return null;

	const handleAvailabilitySave = async () => {
		if (!availabilityName) {
			setNoticeMessage({
				type: 'error',
				title: __('Error', 'doublescale'),
				message: __(
					'Please enter a name for the availability',
					'doublescale'
				),
			});
			setShowNotice(true);
			return;
		}

		const cleanedOverrides: DateOverrides = Object.fromEntries(
			Object.entries(dateOverrides).filter(
				([key]) => key && key.trim() !== ''
			)
		);

		if (!isValidDateOverrides(cleanedOverrides)) {
			setNoticeMessage({
				type: 'error',
				title: __('Error', 'doublescale'),
				message: __(
					'Please select a date for all override entries before saving.',
					'doublescale'
				),
			});
			setShowNotice(true);
			return;
		}
		setSavingChanges(true);
		try {
			await callApi({
				path: `availabilities/${availabilityId}`,
				method: 'PUT',
				data: {
					name: availabilityName,
					value: {
						weekly_hours: availabilityDetails.value.weekly_hours,
						override: cleanedOverrides,
					},
					override: cleanedOverrides,
					timezone: availabilityTimezone,
					is_default: isDefault,
				},
				onSuccess: () => {
					setDateOverrides(cleanedOverrides);
					setNoticeMessage({
						type: 'success',
						title: __('Success', 'doublescale'),
						message: __(
							'Availability updated successfully',
							'doublescale'
						),
					});
					setShowNotice(true);
				},
				onError: (e) => {
					setNoticeMessage({
						type: 'error',
						title: __('Error', 'doublescale'),
						message: e.message,
					});
					setShowNotice(true);
				},
			});
		} catch (error) {
			setNoticeMessage({
				type: 'error',
				title: __('Error', 'doublescale'),
				message: __('Failed to update availability', 'doublescale'),
			});
			setShowNotice(true);
		} finally {
			setSavingChanges(false);
			setIsSaveBtnDisabled(true);
		}
	};

	const onCustomAvailabilityChange = (
		day: string,
		field: string,
		value: boolean | { start: string; end: string }[]
	) => {
		const updatedAvailability = { ...availabilityDetails };
		if (updatedAvailability.value.weekly_hours) {
			if (field === 'off' && typeof value === 'boolean') {
				updatedAvailability.value.weekly_hours[day].off = value;
			} else if (field === 'times' && Array.isArray(value)) {
				updatedAvailability.value.weekly_hours[day].times = value;
			} else {
				return;
			}
		}
		setAvailabilityDetails(updatedAvailability);
		setIsSaveBtnDisabled(false);
	};

	const handleClose = () => {
		navigate('booking/availability');
	};

	return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open)
                    handleClose();
            }}><DialogContent
                hideCloseButton
                className='fixed inset-0 max-w-none w-full h-full translate-x-0 translate-y-0 left-0 top-0 rounded-none p-0 z-[150201] overflow-auto'>
                <div className="border-b mb-4 px-4 py-2">
                    <div className='flex justify-between items-center'>
                        <div className='flex gap-2.5 items-center'>
                            <button
                                type="button"
                                className="cursor-pointer bg-transparent border-0 text-primary"
                                onClick={handleClose}
                                aria-label={__('Close', 'doublescale')}
                            >
                                <IoCloseSharp />
                            </button>
                            <div className="text-[#09090B] text-[24px] font-[500]">
                                {__('Working hours', 'doublescale')}
                            </div>
                        </div>
                        <div className='flex gap-6 items-center'>
                            <Button
                                onClick={handleAvailabilitySave}
                                disabled
                                disabled={isSaveBtnDisabled}
                                className={`rounded-lg font-[500] text-white ${
                                    isSaveBtnDisabled
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-primary '
                                }`}
                                variant='default'>
                                {__('Save Changes', 'doublescale')}
                            </Button>
                        </div>
                    </div>
                </div>
                {showNotice && (
                    <div className="py-4 px-9">
                        <NoticeBanner
                            closeNotice={() => setShowNotice(false)}
                            notice={noticeMessage}
                        />
                    </div>
                )}
                <div className='flex gap-5 px-9 mb-4'>
                    {initialLoading ? (
                        <>
                            <Card className="w-2/3"><CardContent>
                                    <div className='flex gap-5 flex-col'>
                                        <Card><CardContent>
                                                <Skeleton className='h-4 w-full' />
                                            </CardContent></Card>
                                        <Card><CardContent>
                                                <Skeleton className='h-4 w-full' />
                                            </CardContent></Card>
                                        <Card><CardContent>
                                                <Skeleton className='h-4 w-full' />
                                            </CardContent></Card>
                                    </div>
                                </CardContent></Card>
                            <Card className="w-1/3"><CardContent>
                                    <Skeleton className='h-4 w-full' />
                                </CardContent></Card>
                        </>
                    ) : (
                        <>
                            <Card className="w-3/5"><CardContent>
                                    <div className='flex gap-5 flex-col'>
                                        {(availabilityDetails.events_count ?? 0) >
                                            0 && (
                                            <InfoComponent
                                                eventsNumber={
                                                    availabilityDetails.events_count ??
                                                    0
                                                }
                                            />
                                        )}
                                        <Card><CardContent>
                                                <label className="font-normal text-sm">
                                                    <div className="pb-1">
                                                        {__(
                                                            'Availability Name',
                                                            'doublescale'
                                                        )}
                                                        <span className="text-[#EF4444]">
                                                            *
                                                        </span>
                                                    </div>
                                                    <Input
                                                        size="large"
                                                        value={availabilityName}
                                                        onChange={(e) => {
                                                            setAvailabilityName(
                                                                e.target.value
                                                            );
                                                            setIsSaveBtnDisabled(false);
                                                        }}
                                                        placeholder={__(
                                                            'Enter a name for the availability',
                                                            'doublescale'
                                                        )}
                                                    />
                                                </label>
                                                <div className="flex justify-end">
                                                    <div className="flex gap-2 items-center pt-4">
                                                        <Switch
                                                            checked={isDefault}
                                                            onCheckedChange={async () => {
                                                                setIsDefault(!isDefault);
                                                                setIsSaveBtnDisabled(false);
                                                            }}
                                                            className={
                                                                isDefault
                                                                    ? 'bg-primary'
                                                                    : 'bg-gray-400'
                                                            }
                                                        />
                                                        <p className="text-color-primary-text font-bold">
                                                            {__(
                                                                'Set as Default',
                                                                'doublescale'
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent></Card>

                                        <Card><CardContent>
                                                <Schedule
                                                    availability={availabilityDetails.value}
                                                    onCustomAvailabilityChange={
                                                        onCustomAvailabilityChange
                                                    }
                                                    startDay={startDay}
                                                    timeFormat={timeFormat}
                                                />
                                            </CardContent></Card>

                                        <Card><CardContent>
                                                <SelectTimezone
                                                    timezone={availabilityTimezone}
                                                    handleChange={(value) => {
                                                        setAvailabilityTimezone(value);
                                                        setIsSaveBtnDisabled(false);
                                                    }}
                                                    timeFormat={timeFormat}
                                                />
                                            </CardContent></Card>
                                    </div>
                                </CardContent></Card>
                            <div className="w-2/5">
                                <OverrideSection
                                    dateOverrides={dateOverrides || {}}
                                    setDateOverrides={setDateOverrides}
                                    setDisabled={() => setIsSaveBtnDisabled(false)}
                                    timeFormat={timeFormat}
                                />
                            </div>
                        </>
                    )}
                </div>
            </DialogContent></Dialog>
    );
};

export default AvailabilityDetails;
