/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import * as React from 'react';

/**
 * External dependencies
 */
import { Modal, Form, Input, Button, message } from 'antd';
import { MessageSquare } from 'lucide-react';

/**
 * Internal dependencies
 */
import { useActivityOperations } from '../../hooks/use-activity-operations';
import './style.scss';

const { TextArea } = Input;

interface AddNoteModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	dealId: number;
	dealTitle?: string;
	editMode?: boolean;
	activity?: any;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
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
	const { addNote, updateActivity } = useActivityOperations();

	// Load existing activity data when in edit mode
	React.useEffect(() => {
		if (editMode && activity && visible) {
			form.setFieldsValue({
				note: activity.data?.content || '',
			});
		} else if (!visible) {
			form.resetFields();
		}
	}, [editMode, activity, visible, form]);

	const handleSubmit = async (values: { note: string }) => {
		setLoading(true);
		try {
			if (editMode && activity) {
				await updateActivity(activity.id, 'note_added', { note: values.note });
				message.success(__('Note updated successfully!', 'quillcrm'));
			} else {
				await addNote(dealId, values.note);
				message.success(__('Note added successfully!', 'quillcrm'));
			}

			form.resetFields();
			onSuccess();
			onClose();
		} catch (error) {
			message.error(
				error instanceof Error
					? error.message
					: __(editMode ? 'Failed to update note' : 'Failed to add note', 'quillcrm')
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
				<div className="add-note-modal-title">
					<MessageSquare size={20} />
					<span>{editMode ? __('Edit Note', 'quillcrm') : __('Add Note', 'quillcrm')}</span>
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
					{editMode ? __('Update', 'quillcrm') : __('Add Note', 'quillcrm')}
				</Button>,
			]}
			width={500}
			className="add-note-modal"
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
			>
				<Form.Item
					name="note"
					label={__('Note Content', 'quillcrm')}
					rules={[
						{
							required: true,
							message: __(
								'Please enter note content',
								'quillcrm'
							),
						},
						{
							min: 3,
							message: __(
								'Note must be at least 3 characters long',
								'quillcrm'
							),
						},
					]}
				>
					<TextArea
						rows={4}
						placeholder={__('Enter your note here...', 'quillcrm')}
						maxLength={1000}
						showCount
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

