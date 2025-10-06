import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import EmailSequenceModal from './email-sequence-modal';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { END_POINT } from '../constants';
import { EmailSequenceData } from '../types';

interface EditEmailSequenceProps {
	id: number;
	name: string;
	settings?: any;
	onSuccess?: () => void;
	isEditing: boolean;
	setIsEditing: (isEditing: boolean) => void;
}

const EditEmailSequence: React.FC<EditEmailSequenceProps> = ({
	id,
	name,
	settings = {},
	onSuccess,
	isEditing,
	setIsEditing,
}) => {
	const [loading, setLoading] = useState(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const handleSubmit = async (data: EmailSequenceData) => {
		setLoading(true);
		try {
			// Prepare settings object with custom email data if provided
			const updatedSettings: any = { ...settings };
			if (data.setCustomFromNameAndEmail) {
				updatedSettings.from_name = data.fromName;
				updatedSettings.from_email = data.fromEmail;
				updatedSettings.reply_to_name = data.replyToName;
				updatedSettings.reply_to_email = data.replyToEmail;
			} else {
				// Remove custom email settings if checkbox is unchecked
				delete updatedSettings.from_name;
				delete updatedSettings.from_email;
				delete updatedSettings.reply_to_name;
				delete updatedSettings.reply_to_email;
			}

			await apiFetch({
				path: `${END_POINT}/${id}`,
				method: 'PUT',
				data: {
					name: data.name,
					settings: updatedSettings,
				},
			});

			setIsEditing(false);
			createNotice({
				type: 'success',
				message: __('Email sequence updated successfully', 'quillcrm'),
			});

			if (onSuccess) {
				onSuccess();
			}
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to update email sequence', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<EmailSequenceModal
			open={isEditing}
			onOpenChange={setIsEditing}
			onSubmit={handleSubmit}
			title={__('Edit Email Sequence', 'quillcrm')}
			initialValue={{
				name: name,
				fromName: settings?.from_name || '',
				fromEmail: settings?.from_email || '',
				replyToName: settings?.reply_to_name || '',
				replyToEmail: settings?.reply_to_email || '',
				setCustomFromNameAndEmail: !!(
					settings?.from_name || settings?.from_email
				),
			}}
			isLoading={loading}
		/>
	);
};

export default EditEmailSequence;
