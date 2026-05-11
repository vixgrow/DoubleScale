/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 *
 * Host calendars are auto-provisioned for CRM team members (Settings → Team) by
 * the backend `BookingProvisioner`, so this modal only handles team-calendar
 * creation. There is no in-UI path to create a host calendar; the previous
 * "Add Host" flow was removed because the auto-provisioner is the single
 * source of truth.
 */
import type { Calendar } from '@/types/booking';
import { useApi } from '@/hooks/booking';
import { getCurrentTimezone } from '@/utils/booking';
import TeamCalendar from './team-calendar';

interface AddCalendarModalProps {
	open: boolean;
	onClose: () => void;
	onSaved: (calendarType?: string) => void;
	setCreateCalendarMessage: (message: boolean) => void;
	setErrorMessage?: (message: string | null) => void;
}

/**
 * Team Calendar creation modal. (Host calendars are not user-creatable —
 * see file-level docblock above.)
 */
const AddCalendarModal: React.FC<AddCalendarModalProps> = ({
	open,
	onClose,
	onSaved,
	setCreateCalendarMessage,
	setErrorMessage,
}) => {
	const { callApi, loading } = useApi();
	const [formData, setFormData] = useState<
		Partial<Calendar & { members: number[] }>
	>({
		type: 'team',
		members: [],
		timezone: getCurrentTimezone(),
	});

	const updateFormData = (key: keyof typeof formData, value: any) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
	};

	const saveCalendar = async () => {
		try {
			if (!validate()) return;

			try {
				await callApi({
					path: `calendars`,
					method: 'POST',
					data: formData,
					onSuccess: () => {
						closeHandler();
						onSaved('team');
						setCreateCalendarMessage(true);
					},
					onError: (error) => {
						if (setErrorMessage) {
							setErrorMessage(
								error || 'Failed to save calendar'
							);
						}
						console.error('API Error:', error);
					},
				});
			} catch (apiError) {
				console.error('API Call Failed:', apiError);
				if (setErrorMessage) {
					setErrorMessage(
						'An unexpected error occurred while saving the calendar'
					);
				}
			}
		} catch (error) {
			console.error('Unexpected Error in saveCalendar:', error);
			if (setErrorMessage) {
				setErrorMessage(
					'An error occurred while processing your request'
				);
			}
		}
	};

	const validate = (): boolean => {
		if (!formData.name) {
			if (setErrorMessage) {
				setErrorMessage(
					__('Please enter a name for the calendar.', 'doublescale')
				);
			}
			return false;
		}

		if (!formData.members || formData.members.length === 0) {
			if (setErrorMessage) {
				setErrorMessage(
					__('Please select team members.', 'doublescale')
				);
			}
			return false;
		}

		return true;
	};

	const closeHandler = () => {
		onClose();
		setFormData({
			type: 'team',
			members: [],
			timezone: getCurrentTimezone(),
		});
	};

	return (
		<TeamCalendar
			formData={formData}
			updateFormData={updateFormData}
			open={open}
			closeHandler={closeHandler}
			loading={loading}
			saveCalendar={saveCalendar}
		/>
	);
};

export default AddCalendarModal;
