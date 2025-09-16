/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Modal, Form, Input, Button, DatePicker, Select, message } from 'antd';
import { Mail } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import { useActivityOperations } from '../../hooks/use-activity-operations';
import { useContacts } from '../../hooks/use-contacts';
import { Contact } from '../../../../types';
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
	contact_ids: number[]; // Multiple contact selection
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
	const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
	const { logEmail } = useActivityOperations();
	const {
		contacts,
		loading: contactsLoading,
		searchContacts,
	} = useContacts();

	const handleSubmit = async (values: any) => {
		setLoading(true);
		try {
			const emailData: EmailFormData = {
				subject: values.subject,
				contact_ids: values.contact_ids || [],
				sent_at: values.sent_at
					? dayjs(values.sent_at).format('YYYY-MM-DD HH:mm:ss')
					: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			};

			await logEmail(dealId, emailData);

			message.success(__('Email logged successfully!', 'quillcrm'));

			onSuccess();
			onClose();
			form.resetFields();
			setSelectedContacts([]);
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
		setSelectedContacts([]);
		onClose();
	};

	const handleContactsChange = (contactIds: number[]) => {
		const selectedContactsList = contactIds
			.map((id) => contacts.find((c) => c.id === id))
			.filter(Boolean) as Contact[];
		setSelectedContacts(selectedContactsList);
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

				<div className="form-row">
					<Form.Item
						name="contact_ids"
						label={__('Recipients', 'quillcrm')}
						rules={[
							{
								required: true,
								message: __(
									'Please select at least one contact',
									'quillcrm'
								),
							},
						]}
						className="form-item-half"
					>
						<Select
							mode="multiple"
							showSearch
							placeholder={__(
								'Search and select contacts...',
								'quillcrm'
							)}
							loading={contactsLoading}
							onSearch={searchContacts}
							onChange={handleContactsChange}
							filterOption={false}
							notFoundContent={
								contactsLoading
									? __('Loading...', 'quillcrm')
									: __('No contacts found', 'quillcrm')
							}
							maxTagCount="responsive"
						>
							{contacts.map((contact) => (
								<Select.Option
									key={contact.id}
									value={contact.id}
								>
									<div>
										<strong>
											{contact.first_name}{' '}
											{contact.last_name}
										</strong>
										<br />
										<small style={{ color: '#666' }}>
											{contact.email}
										</small>
									</div>
								</Select.Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item
						name="sent_at"
						label={__('Sent Date & Time', 'quillcrm')}
						className="form-item-half"
					>
						<DatePicker
							showTime
							format="YYYY-MM-DD HH:mm"
							style={{ width: '100%' }}
						/>
					</Form.Item>
				</div>
			</Form>
		</Modal>
	);
};
