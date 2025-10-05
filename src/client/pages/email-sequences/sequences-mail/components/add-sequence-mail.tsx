import React from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import SequenceMailModal from './sequence-mail-modal';
import { END_POINT, SEQUENCE_MAIL_TYPE } from '../../constants';

// Import types
import {
	AddSequenceMailProps,
	SequenceMailSettings,
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

	const handleSave = async (data: SequenceMailSettings) => {
		// Start processing
		try {
			// Prepare the data for API
			const sequenceMailData: SequenceMailRequest = {
				type: SEQUENCE_MAIL_TYPE,
				parent_id: sequenceId,
				name: data.subject, // Use subject as name for consistency
				settings: {
					subject: data.subject,
					pre_header: data.pre_header,
					delay: {
						value: data.delay.value,
						unit: data.delay.unit.toLowerCase(),
					},
					sending_time_range: {
						from: data.sending_time_range.from,
						to: data.sending_time_range.to,
					},
					enable_specific_days: data.enable_specific_days,
					days: data.days,
					add_utm_parameters: data.add_utm_parameters,
					utm_parameters: data.utm_parameters,
					email_body: data.email_body,
				},
				description: __('New sequence email', 'quillcrm'),
				status: 'draft',
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
				pre_header: '',
				delay: {
					value: 0,
					unit: 'Minutes',
				},
				sending_time_range: {
					from: '',
					to: '',
				},
				enable_specific_days: false,
				days: {
					monday: false,
					tuesday: false,
					wednesday: false,
					thursday: false,
					friday: false,
					saturday: false,
					sunday: false,
				},
				add_utm_parameters: false,
				utm_parameters: {
					campaign_source: '',
					campaign_medium: '',
					campaign_name: '',
					campaign_term: '',
					campaign_content: '',
				},
				email_body: '',
			}}
		/>
	);
};

export default AddSequenceMail;
