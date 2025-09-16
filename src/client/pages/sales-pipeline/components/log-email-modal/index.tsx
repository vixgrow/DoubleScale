/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

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
}) => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const { logEmail } = useActivityOperations();

	const handleSubmit = async (values: any) => {
		setLoading(true);
		try {
			const emailData: EmailFormData = {
				subject: values.subject,
				sent_at: values.sent_at
					? dayjs(values.sent_at).format('YYYY-MM-DD HH:mm:ss')
					: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			};

			await logEmail(dealId, emailData);

			message.success(__('Email logged successfully!', 'quillcrm'));

			onSuccess();
			onClose();
			form.resetFields();
		} catch (error) {
			message.error(
				error instanceof Error
					? error.message
					: __('Failed to log email', 'quillcrm')
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
					<span>{__('Log Email', 'quillcrm')}</span>
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
					{__('Log Email', 'quillcrm')}
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
