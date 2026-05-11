/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	CardHeader,
	CurrentTimeInTimezone,
	FieldWrapper,
	TimezoneSelect,
} from '@/components/booking';
import { Availability } from '@/types/booking';
import { useApi, useNotice, useNavigate } from '@/hooks/booking';
import { DEFAULT_WEEKLY_HOURS } from '@/constants/booking';
import { getCurrentTimezone } from '@/utils/booking';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AddAvailabilityModalProps {
	open: boolean;
	setOpen: (value: boolean) => void;
}

/**
 * Availability Events Component.
 */

const AddAvailabilityScheduleModal: React.FC<AddAvailabilityModalProps> = ({
	open,
	setOpen,
}) => {
	const { callApi, loading } = useApi();
	const [formData, setFormData] = useState<Partial<Availability>>({
		name: '',
		timezone: getCurrentTimezone(),
		value: {
			weekly_hours: DEFAULT_WEEKLY_HOURS,
			override: {},
		},
	});
	const [isDisabled, setIsDisabled] = useState(true);

	const updateFormData = (
		key: keyof typeof formData,
		value: Partial<Availability>[keyof Availability]
	) => {
		if (formData.name && formData.timezone) {
			setIsDisabled(false);
		}
		setFormData((prev) => ({ ...prev, [key]: value }));
	};
	const { errorNotice } = useNotice();
	const navigate = useNavigate();

	const saveAvailabilitySchedule = async () => {
		if (!validate() || loading) return;

		try {
			await callApi({
				path: 'availabilities',
				method: 'POST',
				data: formData,
				onSuccess: (response) => {
					closeHandler();
					sessionStorage.setItem('showNewScheduleNotice', 'true');
					navigate(`booking/availability/${response.id}`);
				},
				onError: () => {
					errorNotice(
						__(
							'Failed to save availability schedule.',
							'doublescale'
						)
					);
				},
			});
		} catch (error) {
			console.error('Error in saveAvailabilitySchedule:', error);
			errorNotice(
				__(
					'An unexpected error occurred while saving the schedule.',
					'doublescale'
				)
			);
		}
	};

	const closeHandler = () => {
		setOpen(false);
		setFormData({ name: '', timezone: getCurrentTimezone() });
		setIsDisabled(true);
	};

	const validate = () => {
		if (!formData.name) {
			errorNotice(
				__('Please enter a title for the availability.', 'doublescale')
			);
			return false;
		}

		if (!formData.timezone) {
			errorNotice(__('Please select a timezone.', 'doublescale'));
			return false;
		}

		return true;
	};

	return (
        <Dialog
            open={open}
            onOpenChange={open => {
                if (!open)
                    closeHandler();
            }}><DialogContent><DialogHeader><DialogTitle>{<CardHeader
                            className="pb-2"
                            title={__('Add New Availability', 'doublescale')}
                            description={__('Add the following data.', 'doublescale')}
                            icon={null}
                            border={false}
                        />}</DialogTitle></DialogHeader>
                <div className='flex flex-col gap-5'>
                    <FieldWrapper
                        label={__('Schedule Title', 'doublescale')}
                        required={true}
                    >
                        <Input
                            className="rounded-lg"
                            value={formData.name}
                            onChange={(e) => updateFormData('name', e.target.value)}
                            placeholder={__(
                                'Enter a title for the availability',
                                'doublescale'
                            )}
                        />
                    </FieldWrapper>

                    <FieldWrapper
                        label={__('Select Your Timezone', 'doublescale')}
                        required={true}
                    >
                        <TimezoneSelect
                            value={formData.timezone || null}
                            onChange={(value) => updateFormData('timezone', value)}
                        />
                        <CurrentTimeInTimezone className="text-[#818181] text-xs" />
                    </FieldWrapper>

                    <Button
                        onClick={saveAvailabilitySchedule}
                        disabled={isDisabled || loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                        {loading ? __('Saving...', 'doublescale') : __('Save', 'doublescale')}
                    </Button>
                </div>
            </DialogContent></Dialog>
    );
};

export default AddAvailabilityScheduleModal;
