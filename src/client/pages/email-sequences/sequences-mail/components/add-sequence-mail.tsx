import React from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import SequenceMailModal from './sequence-mail-modal';
import { END_POINT, SEQUENCE_MAIL_TYPE } from '../../constants';

// Import types
import {
	AddSequenceMailProps,
	SequenceMailFormData,
	SequenceMailRequest,
} from '../../types';

const AddSequenceMail: React.FC<AddSequenceMailProps> = ({
	isAdding,
	setIsAdding,
	sequenceId,
	onSuccess,
}) => {
	const { createNotice } = useDispatch('quillcrm/core');

	const handleClose = () => {
		setIsAdding(false);
	};

	const handleSave = async (data: SequenceMailFormData) => {
		// Start processing
		try {
			// Prepare the data for API
			const sequenceMailData: SequenceMailRequest = {
				type: SEQUENCE_MAIL_TYPE,
				parent_id: sequenceId,
				settings: {
					subject: data.subject,
					pre_header: data.preHeader,
					delay: data.delay,
					sending_time_range: data.sendingTimeRange,
					enable_specific_days: data.enableSpecificDays,
					days: data.days,
					add_utm_parameters: data.addUtmParameters,
					email_body: data.emailBody,
				},
				description: __('New sequence email', 'quillcrm'),
				status: 'draft',
				name: data.subject,
			};

			// Make the API call
			await apiFetch({
				path: END_POINT,
				method: 'POST',
				data: sequenceMailData,
			});

			createNotice({
				type: 'success',
				message: __('Sequence email added successfully', 'quillcrm'),
			});

			// Call the success callback to refresh the list
			onSuccess();
			handleClose();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to add sequence email', 'quillcrm'),
			});
		} finally {
			// Processing complete
		}
	};

	return (
		<SequenceMailModal
			isOpen={isAdding}
			onClose={handleClose}
			title={__('Add Sequence Email', 'quillcrm')}
			onSave={handleSave}
			initialData={{
				subject: '',
				preHeader: '',
				delay: {
					value: 0,
					unit: 'Minutes',
				},
				sendingTimeRange: {
					from: '',
					to: '',
				},
				enableSpecificDays: false,
				days: {
					monday: false,
					tuesday: false,
					wednesday: false,
					thursday: false,
					friday: false,
					saturday: false,
					sunday: false,
				},
				addUtmParameters: false,
				emailBody: '',
			}}
		/>
	);
};

export default AddSequenceMail;
