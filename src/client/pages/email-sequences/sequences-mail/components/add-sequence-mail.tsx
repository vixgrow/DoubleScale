import React, { useEffect, useRef, useState } from 'react';
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
import { NoticeMessage } from '@/client/types';

const AddSequenceMail: React.FC<AddSequenceMailProps> = ({
	isAdding,
	setIsAdding,
	sequenceId,
	onSuccess,
	handleNavigate,
}) => {
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const { createNotice } = useDispatch('doublescale/core');

	const handleClose = () => {
		setIsAdding(false);
	};
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [notice]);

	const handleCloseNotice = () => {
		setNotice(null);
	};

	const handleSave = async (data: SequenceMailFormData) => {
		// Start processing
		try {
			// Prepare the data for API
			if (!data.subject || data.subject.trim() === '') {
				setNotice({
					type: 'error',
					message: __('Subject is required', 'doublescale'),
				});

				return;
			}
			if (!data.email_body || data.email_body.trim() === '') {
				setNotice({
					type: 'error',
					message: __('Email body is required', 'doublescale'),
				});
				return;
			}
			const sequenceMailData: SequenceMailRequest = {
				type: SEQUENCE_MAIL_TYPE,
				parent_id: sequenceId,
				name: data.subject,
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
				description: __('New sequence email', 'doublescale'),
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
				message: __('Sequence email added successfully', 'doublescale'),
			});

			// Call the success callback to refresh the list
			onSuccess();
			handleClose();
		} catch (error: any) {
			setNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to add sequence email', 'doublescale'),
			});
		} finally {
			// Processing complete
		}
	};

	return (
		<SequenceMailModal
			isOpen={isAdding}
			onClose={handleClose}
			title={__(`Email (${sequenceId})`, 'doublescale')}
			onSave={handleSave}
			initialData={{
				subject: '',
				email_body: '',
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
			}}
			notice={notice}
			noticeBannerRef={noticeBannerRef}
			closeNotice={handleCloseNotice}
			handleNavigate={handleNavigate}
		/>
	);
};

export default AddSequenceMail;
