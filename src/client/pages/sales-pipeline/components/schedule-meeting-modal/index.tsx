/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Modal, Form, Input, Button, DatePicker, Select, message } from 'antd';
import { Calendar } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import { useActivityOperations } from '../../hooks/use-activity-operations';
import { useContacts } from '../../hooks/use-contacts';
import { Contact } from '../../../../types';
import './style.scss';

const { TextArea } = Input;
const { Option } = Select;

interface ScheduleMeetingModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	dealId: number;
	dealTitle?: string;
}

interface MeetingFormData {
	title: string;
	scheduled_at: string;
	duration: number;
	location: string;
	description: string;
	attendee_contact_ids?: number[];
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
	visible,
	onClose,
	onSuccess,
	dealId,
	dealTitle,
}) => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
	const { scheduleMeeting } = useActivityOperations();
	const {
		contacts,
		loading: contactsLoading,
		searchContacts,
	} = useContacts();

	const handleSubmit = async (values: any) => {
		setLoading(true);
		try {
			const meetingData: MeetingFormData = {
				title: values.title,
				scheduled_at: dayjs(values.scheduled_at).format(
					'YYYY-MM-DD HH:mm:ss'
				),
				duration: values.duration || 60,
				location: values.location || '',
				description: values.description || '',
				attendee_contact_ids: values.attendee_contact_ids || [],
			};

			await scheduleMeeting(dealId, meetingData);

			message.success(__('Meeting scheduled successfully!', 'quillcrm'));

			form.resetFields();
			setSelectedContacts([]);
			onSuccess();
			onClose();
		} catch (error) {
			message.error(
				error instanceof Error
					? error.message
					: __('Failed to schedule meeting', 'quillcrm')
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
				<div className="schedule-meeting-modal-title">
					<Calendar size={20} />
					<span>{__('Schedule Meeting', 'quillcrm')}</span>
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
					{__('Schedule Meeting', 'quillcrm')}
				</Button>,
			]}
			width={600}
			className="schedule-meeting-modal"
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
					duration: 60,
					scheduled_at: dayjs().add(1, 'hour'),
				}}
			>
				<Form.Item
					name="title"
					label={__('Meeting Title', 'quillcrm')}
					rules={[
						{
							required: true,
							message: __(
								'Please enter meeting title',
								'quillcrm'
							),
						},
					]}
				>
					<Input
						placeholder={__('Enter meeting title...', 'quillcrm')}
					/>
				</Form.Item>

				<div className="form-row">
					<Form.Item
						name="scheduled_at"
						label={__('Date & Time', 'quillcrm')}
						rules={[
							{
								required: true,
								message: __(
									'Please select date and time',
									'quillcrm'
								),
							},
						]}
						className="form-item-half"
					>
						<DatePicker
							showTime
							format="YYYY-MM-DD HH:mm"
							style={{ width: '100%' }}
						/>
					</Form.Item>

					<Form.Item
						name="duration"
						label={__('Duration (minutes)', 'quillcrm')}
						className="form-item-half"
					>
						<Select placeholder={__('Select duration', 'quillcrm')}>
							<Option value={15}>
								15 {__('minutes', 'quillcrm')}
							</Option>
							<Option value={30}>
								30 {__('minutes', 'quillcrm')}
							</Option>
							<Option value={45}>
								45 {__('minutes', 'quillcrm')}
							</Option>
							<Option value={60}>
								1 {__('hour', 'quillcrm')}
							</Option>
							<Option value={90}>
								1.5 {__('hours', 'quillcrm')}
							</Option>
							<Option value={120}>
								2 {__('hours', 'quillcrm')}
							</Option>
						</Select>
					</Form.Item>
				</div>

				<Form.Item name="location" label={__('Location', 'quillcrm')}>
					<Input
						placeholder={__(
							'Meeting room, video call link, address...',
							'quillcrm'
						)}
					/>
				</Form.Item>

				<Form.Item
					name="attendee_contact_ids"
					label={__('Attendees (Optional)', 'quillcrm')}
					extra={__(
						'Select contacts who will attend this meeting',
						'quillcrm'
					)}
				>
					<Select
						mode="multiple"
						showSearch
						placeholder={__(
							'Search and select attendees...',
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
							<Select.Option key={contact.id} value={contact.id}>
								<div>
									<strong>
										{contact.first_name} {contact.last_name}
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
					name="description"
					label={__('Meeting Description', 'quillcrm')}
				>
					<TextArea
						rows={3}
						placeholder={__(
							'Meeting agenda, topics to discuss...',
							'quillcrm'
						)}
						maxLength={500}
						showCount
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};
