/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import * as React from 'react';

/**
 * External dependencies
 */
import { Modal, Form, Input, Button, DatePicker, message } from 'antd';
import { Mail } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import { useActivityOperations } from '../../hooks/use-activity-operations';
import './style.scss';

interface LogEmailModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	dealId: number;
	dealTitle?: string;
	editMode?: boolean;
	activity?: any;
}

interface EmailFormData {
	subject: string;
	sent_at: string;
}

export const LogEmailModal: React.FC<LogEmailModalProps> = ({
	visible,
	onClose,
	onSuccess,
	dealId,
	dealTitle,
	editMode = false,
	activity,
}) => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const { logEmail, updateActivity } = useActivityOperations();

	// Load existing activity data when in edit mode
	React.useEffect(() => {
		if (editMode && activity && visible) {
			form.setFieldsValue({
				subject: activity.data?.subject || '',
				sent_at: activity.data?.sent_at ? dayjs(activity.data.sent_at) : dayjs(),
			});
		} else if (!visible) {
			form.resetFields();
		}
	}, [editMode, activity, visible, form]);

	const handleSubmit = async (values: any) => {
		setLoading(true);
		try {
			const emailData: EmailFormData = {
				subject: values.subject,
				sent_at: values.sent_at
					? dayjs(values.sent_at).format('YYYY-MM-DD HH:mm:ss')
					: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			};

			if (editMode && activity) {
				await updateActivity(activity.id, 'email_sent', emailData);
				message.success(__('Email updated successfully!', 'quillcrm'));
			} else {
				await logEmail(dealId, emailData);
				message.success(__('Email logged successfully!', 'quillcrm'));
			}

			onSuccess();
			onClose();
			form.resetFields();
		} catch (error) {
			message.error(
				error instanceof Error
					? error.message
					: __(editMode ? 'Failed to update email' : 'Failed to log email', 'quillcrm')
			);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		form.resetFields();
		onClose();
	};

	return (
		<Modal
			title={
				<div className="log-email-modal-title">
					<Mail size={20} />
					<span>{editMode ? __('Edit Email', 'quillcrm') : __('Log Email', 'quillcrm')}</span>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			footer={[
				<Button key="cancel" onClick={handleCancel}>
					{__('Cancel', 'quillcrm')}
				</Button>,
				<Button
					key="submit"
					type="primary"
					loading={loading}
					onClick={() => form.submit()}
				>
					{editMode ? __('Update', 'quillcrm') : __('Log Email', 'quillcrm')}
				</Button>,
			]}
			width={600}
			className="log-email-modal"
		>
			{dealTitle && (
				<div className="deal-context">
					<span className="deal-label">
						{__('Deal:', 'quillcrm')}
					</span>
					<span className="deal-title">{dealTitle}</span>
				</div>
			)}

			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				autoComplete="off"
				initialValues={{
					sent_at: dayjs(),
				}}
			>
				<Form.Item
					name="subject"
					label={__('Email Subject', 'quillcrm')}
					rules={[
						{
							required: true,
							message: __(
								'Please enter email subject',
								'quillcrm'
							),
						},
					]}
				>
					<Input
						placeholder={__('Enter email subject...', 'quillcrm')}
					/>
				</Form.Item>

				<Form.Item
					name="sent_at"
					label={__('Sent Date & Time', 'quillcrm')}
				>
					<DatePicker
						showTime
						format="YYYY-MM-DD HH:mm"
						style={{ width: '100%' }}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};
