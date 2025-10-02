import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import EmailSequenceModal from './email-sequence-modal';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { END_POINT } from '../constants';

interface EditEmailSequenceProps {
	id: number;
	name: string;
	onSuccess?: () => void;
	isEditing: boolean;
	setIsEditing: (isEditing: boolean) => void;
}

const EditEmailSequence: React.FC<EditEmailSequenceProps> = ({
	id,
	name,
	onSuccess,
	isEditing,
	setIsEditing,
}) => {
	const [loading, setLoading] = useState(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const handleSubmit = async (newName: string) => {
		setLoading(true);
		try {
			await apiFetch({
				path: `${END_POINT}/${id}`,
				method: 'PUT',
				data: { name: newName },
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
			initialValue={name}
			isLoading={loading}
		/>
	);
};

export default EditEmailSequence;
