import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import SequenceMailModal from './sequence-mail-modal';
import { END_POINT, SEQUENCE_MAIL_TYPE } from '../../constants';

// Import types
import {
	EditSequenceMailProps,
	SequenceMail,
	SequenceMailFormData,
	SequenceMailRequest,
} from '../../types';

const EditSequenceMail: React.FC<EditSequenceMailProps> = ({
	isEditing,
	setIsEditing,
	sequenceId,
	emailId,
	onSuccess,
}) => {
	const { createNotice } = useDispatch('quillcrm/core');
	const [loading, setLoading] = useState(false);
	const [emailData, setEmailData] = useState<SequenceMail | null>(null);

	useEffect(() => {
		if (isEditing && emailId) {
			fetchEmailData();
		}
	}, [isEditing, emailId]);

	const fetchEmailData = async () => {
		setLoading(true);
		try {
			// Fetch the email data using the emailId
			const response = await apiFetch<SequenceMail>({
				path: END_POINT + `/${emailId}`,
			});

			// Handle case where settings might be empty or null
			const settings = response.settings || {};

			if (!response.settings) {
				response.settings = {
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
					templates: [],
				};
			} else {
				// Ensure all required fields exist
				response.settings.pre_header = settings.pre_header || '';

				if (!response.settings.delay) {
					response.settings.delay = { value: 0, unit: 'Minutes' };
				} else {
					response.settings.delay.unit = capitalizeFirstLetter(
						response.settings.delay.unit || 'minutes'
					);
				}

				if (!response.settings.sending_time_range) {
					response.settings.sending_time_range = {
						from: '',
						to: '',
					};
				}

				if (!response.settings.days) {
					response.settings.days = {
						monday: false,
						tuesday: false,
						wednesday: false,
						thursday: false,
						friday: false,
						saturday: false,
						sunday: false,
					};
				}

				// Ensure templates field exists
				if (!response.settings.templates) {
					response.settings.templates = [];
				}
			}

			setEmailData(response);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to fetch email data', 'quillcrm'),
			});
			setIsEditing(false);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setIsEditing(false);
		setEmailData(null);
	};

	const handleSave = async (data: SequenceMailFormData) => {
		setLoading(true);
		try {
			// Prepare the data for API
			const sequenceMailData: SequenceMailRequest = {
				type: SEQUENCE_MAIL_TYPE,
				parent_id: sequenceId, // Include parent_id to maintain relationship
				name: data.subject, // Use subject as name for consistency
				subject: data.subject,
				email_body: data.email_body,
				settings: {
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
					templates: data.templates || [],
				},
			};

			// Make the API call
			await apiFetch({
				path: END_POINT + `/${emailId}`,
				method: 'PUT',
				data: sequenceMailData,
			});

			createNotice({
				type: 'success',
				message: __('Sequence email updated successfully', 'quillcrm'),
			});

			// Call the success callback to refresh the list
			onSuccess();
			handleClose();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to update sequence email', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	// Helper function to capitalize first letter
	const capitalizeFirstLetter = (string: string): string => {
		return string.charAt(0).toUpperCase() + string.slice(1);
	};

	if (loading && !emailData) {
		return null; // Or return a loading indicator
	}

	return emailData ? (
		<SequenceMailModal
			isOpen={isEditing}
			onClose={handleClose}
			title={__('Edit Sequence Email', 'quillcrm')}
			onSave={handleSave}
			initialData={{
				subject: emailData.subject,
				email_body: emailData.email_body,
				pre_header: emailData.settings.pre_header,
				delay: {
					value: emailData.settings.delay.value,
					unit: emailData.settings.delay.unit,
				},
				sending_time_range: {
					from: emailData.settings.sending_time_range.from,
					to: emailData.settings.sending_time_range.to,
				},
				enable_specific_days: emailData.settings.enable_specific_days,
				days: emailData.settings.days,
				add_utm_parameters: emailData.settings.add_utm_parameters,
				utm_parameters: emailData.settings.utm_parameters,
				templates: emailData.settings.templates || [],
			}}
		/>
	) : null;
};

export default EditSequenceMail;
