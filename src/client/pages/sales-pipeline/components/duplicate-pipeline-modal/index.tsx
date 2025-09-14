/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Modal, Form, Input, Typography, Alert, Space } from 'antd';
import { Copy } from 'lucide-react';

/**
 * Internal dependencies
 */
import { usePipelineOperations } from '../../hooks/use-pipeline-operations';
import './style.scss';

const { Title, Text } = Typography;

export interface DuplicatePipelineModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	pipeline: any | null;
}

export const DuplicatePipelineModal: React.FC<DuplicatePipelineModalProps> = ({
	visible,
	onClose,
	onSuccess,
	pipeline,
}) => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);

	const { duplicatePipeline } = usePipelineOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	// Initialize form when pipeline changes
	useEffect(() => {
		if (pipeline && visible) {
			form.setFieldsValue({
				name: `Copy of ${pipeline.name}`,
			});
		}
	}, [pipeline, visible, form]);

	const handleSubmit = async (values: { name: string }) => {
		if (!pipeline) return;

		setLoading(true);
		try {
			await duplicatePipeline(pipeline.id, values.name.trim());

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __(
						`Pipeline "${values.name}" created successfully!`,
						'quillcrm'
					),
				});
			}

			onSuccess();
			onClose();
			form.resetFields();
		} catch (error) {
			if (createNotice) {
				createNotice({
					type: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Failed to duplicate pipeline', 'quillcrm'),
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

	if (!pipeline) return null;

	return (
		<Modal
			title={
				<div className="modal-title">
					<Copy size={20} />
					<span>{__('Duplicate Pipeline', 'quillcrm')}</span>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			onOk={() => form.submit()}
			confirmLoading={loading}
			width={500}
			className="duplicate-pipeline-modal"
			okText={__('Duplicate Pipeline', 'quillcrm')}
			cancelText={__('Cancel', 'quillcrm')}
		>
			<div className="duplicate-modal-content">
				<Alert
					message={__('What will be duplicated?', 'quillcrm')}
					description={
						<ul className="duplicate-info-list">
							<li>
								{__(
									'Pipeline name and description',
									'quillcrm'
								)}
							</li>
							<li>
								{__(
									'All stages with their colors and probabilities',
									'quillcrm'
								)}
							</li>
							<li>
								{__(
									'Stage order and configuration',
									'quillcrm'
								)}
							</li>
						</ul>
					}
					type="info"
					showIcon
					style={{ marginBottom: 24 }}
				/>

				<Form
					form={form}
					layout="vertical"
					onFinish={handleSubmit}
					className="duplicate-pipeline-form"
				>
					<Form.Item
						name="name"
						label={__('New Pipeline Name', 'quillcrm')}
						rules={[
							{
								required: true,
								message: __(
									'Please enter a pipeline name',
									'quillcrm'
								),
							},
							{
								max: 255,
								message: __(
									'Name must not exceed 255 characters',
									'quillcrm'
								),
							},
						]}
					>
						<Input
							placeholder={__('Enter pipeline name', 'quillcrm')}
							maxLength={255}
							showCount
						/>
					</Form.Item>

					<div className="source-pipeline-info">
						<Title level={5}>
							{__('Source Pipeline', 'quillcrm')}
						</Title>
						<div className="pipeline-card">
							<div className="pipeline-header">
								<Text strong>{pipeline.name}</Text>
								<Text type="secondary">
									{pipeline.stages?.length || 0}{' '}
									{__('stages', 'quillcrm')}
								</Text>
							</div>
							{pipeline.description && (
								<Text
									type="secondary"
									className="pipeline-description"
								>
									{pipeline.description}
								</Text>
							)}
							<div className="stages-preview">
								<Space wrap>
									{pipeline.stages?.map((stage: any) => (
										<span
											key={stage.id}
											className="stage-tag"
											style={{
												backgroundColor: stage.color,
											}}
										>
											{stage.name}
										</span>
									))}
								</Space>
							</div>
						</div>
					</div>

					<Alert
						message={__(
							'Note: Deals will not be copied to the new pipeline.',
							'quillcrm'
						)}
						type="warning"
						showIcon
						style={{ marginTop: 16 }}
					/>
				</Form>
			</div>
		</Modal>
	);
};
