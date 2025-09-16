/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Modal, Form, Input, Button, DatePicker, Select } from 'antd';
import { Calendar } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import { useActivityOperations } from '../../hooks/use-activity-operations';
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
	attendees?: string[];
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
	const { scheduleMeeting } = useActivityOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

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
			};

			// Parse attendees from comma-separated string
			if (values.attendees) {
				meetingData.attendees = values.attendees
					.split(',')
					.map((email: string) => email.trim())
					.filter((email: string) => email.length > 0);
			}

			await scheduleMeeting(dealId, meetingData);

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __('Meeting scheduled successfully!', 'quillcrm'),
				});
			}

			form.resetFields();
			onSuccess();
			onClose();
		} catch (error) {
			if (createNotice) {
				createNotice({
					type: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Failed to schedule meeting', 'quillcrm'),
				});
			}
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
					name="attendees"
					label={__('Attendees (Optional)', 'quillcrm')}
					extra={__(
						'Enter email addresses separated by commas',
						'quillcrm'
					)}
				>
					<Input placeholder="john@example.com, jane@example.com" />
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

