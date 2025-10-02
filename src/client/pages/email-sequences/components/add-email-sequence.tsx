import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import EmailSequenceModal from './email-sequence-modal';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { EMAIL_SEQUENCE_TYPE, END_POINT } from '../constants';

interface AddEmailSequenceProps {
	onSuccess?: () => void;
	isAdding: boolean;
	setIsAdding: (isAdding: boolean) => void;
}

interface EmailSequence {
	id: number;
	name: string;
	description: string;
	settings: object;
	status: string;
}

const AddEmailSequence: React.FC<AddEmailSequenceProps> = ({
	onSuccess,
	isAdding,
	setIsAdding,
}) => {
	const [loading, setLoading] = useState(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const handleSubmit = async (name: string) => {
		setLoading(true);
		try {
			(await apiFetch({
				path: END_POINT,
				method: 'POST',
				data: {
					name: name,
					settings: {},
					description: __('New email sequence', 'quillcrm'),
					type: EMAIL_SEQUENCE_TYPE,
					status: 'draft',
				},
			})) as EmailSequence;

			setIsAdding(false);
			createNotice({
				type: 'success',
				message: __('Email sequence created successfully', 'quillcrm'),
			});

			if (onSuccess) {
				onSuccess();
			}
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to create email sequence', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<EmailSequenceModal
				open={isAdding}
				onOpenChange={setIsAdding}
				onSubmit={handleSubmit}
				title={__('Create Email Sequence', 'quillcrm')}
				isLoading={loading}
			/>
		</>
	);
};

export default AddEmailSequence;
