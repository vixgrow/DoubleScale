/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	Modal,
	Form,
	Input,
	Button,
	Select,
	TimePicker,
	DatePicker,
	message,
} from 'antd';
import { Phone } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import { useActivityOperations } from '../../hooks/use-activity-operations';
import './style.scss';

const { TextArea } = Input;
const { Option } = Select;

interface LogCallModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	dealId: number;
	dealTitle?: string;
}

interface CallFormData {
	phone_number?: string;
	duration: number;
	outcome: string;
	notes: string;
	called_at: string;
}

export const LogCallModal: React.FC<LogCallModalProps> = ({
	visible,
	onClose,
	onSuccess,
	dealId,
	dealTitle,
}) => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const { logCall } = useActivityOperations();

	const handleSubmit = async (values: any) => {
		setLoading(true);
		try {
			const callData: CallFormData = {
				phone_number: values.phone_number,
				duration: values.duration || 0,
				outcome: values.outcome,
				notes: values.notes || '',
				called_at: values.called_at
					? dayjs(values.called_at).format('YYYY-MM-DD HH:mm:ss')
					: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			};

			await logCall(dealId, callData);

			message.success(__('Call logged successfully!', 'quillcrm'));

			form.resetFields();
			onSuccess();
			onClose();
		} catch (error) {
			message.error(
				error instanceof Error
					? error.message
					: __('Failed to log call', 'quillcrm')
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
				<div className="log-call-modal-title">
					<Phone size={20} />
					<span>{__('Log Call', 'quillcrm')}</span>
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
					{__('Log Call', 'quillcrm')}
				</Button>,
			]}
			width={600}
			className="log-call-modal"
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
					outcome: 'completed',
					called_at: dayjs(),
				}}
			>
				<div className="form-row">
					<Form.Item
						name="phone_number"
						label={__('Phone Number', 'quillcrm')}
						className="form-item-half"
					>
						<Input
							placeholder={__('+1 (555) 123-4567', 'quillcrm')}
						/>
					</Form.Item>

					<Form.Item
						name="duration"
						label={__('Duration (minutes)', 'quillcrm')}
						className="form-item-half"
					>
						<Input type="number" min={0} placeholder="30" />
					</Form.Item>
				</div>

				<div className="form-row">
					<Form.Item
						name="outcome"
						label={__('Call Outcome', 'quillcrm')}
						rules={[
							{
								required: true,
								message: __(
									'Please select call outcome',
									'quillcrm'
								),
							},
						]}
						className="form-item-half"
					>
						<Select placeholder={__('Select outcome', 'quillcrm')}>
							<Option value="completed">
								{__('Completed', 'quillcrm')}
							</Option>
							<Option value="no_answer">
								{__('No Answer', 'quillcrm')}
							</Option>
							<Option value="busy">
								{__('Busy', 'quillcrm')}
							</Option>
							<Option value="voicemail">
								{__('Voicemail', 'quillcrm')}
							</Option>
							<Option value="callback_requested">
								{__('Callback Requested', 'quillcrm')}
							</Option>
							<Option value="not_interested">
								{__('Not Interested', 'quillcrm')}
							</Option>
							<Option value="follow_up">
								{__('Follow Up', 'quillcrm')}
							</Option>
						</Select>
					</Form.Item>

					<Form.Item
						name="called_at"
						label={__('Call Date & Time', 'quillcrm')}
						className="form-item-half"
					>
						<DatePicker
							showTime
							format="YYYY-MM-DD HH:mm"
							style={{ width: '100%' }}
						/>
					</Form.Item>
				</div>

				<Form.Item name="notes" label={__('Call Notes', 'quillcrm')}>
					<TextArea
						rows={4}
						placeholder={__(
							'Enter call notes, discussion points, next steps...',
							'quillcrm'
						)}
						maxLength={1000}
						showCount
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

