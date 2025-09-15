/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Form, Input, Button, message } from 'antd';
import { Save } from 'lucide-react';

/**
 * Internal dependencies
 */
import { usePipelineOperations } from '../../hooks/use-pipeline-operations';
import './style.scss';

interface Pipeline {
	id: number;
	name: string;
	description: string;
}

interface PipelineBasicInfoFormProps {
	pipeline: Pipeline;
	onUpdate?: () => void;
	updatePipelineOptimistically?: (pipelineId: number, updates: any) => void;
	loading?: boolean;
}

export const PipelineBasicInfoForm: React.FC<PipelineBasicInfoFormProps> = ({
	pipeline,
	onUpdate,
	updatePipelineOptimistically,
	loading: externalLoading = false,
}) => {
	const [form] = Form.useForm();
	const [internalLoading, setInternalLoading] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);

	const { updatePipeline } = usePipelineOperations();
	const loading = externalLoading || internalLoading;

	// Initialize form with pipeline data
	useEffect(() => {
		if (pipeline) {
			form.setFieldsValue({
				name: pipeline.name,
				description: pipeline.description || '',
			});
			setHasChanges(false);
		}
	}, [pipeline, form]);

	// Check for changes
	const handleFormChange = () => {
		const values = form.getFieldsValue();
		const nameChanged = values.name !== pipeline.name;
		const descChanged =
			(values.description || '') !== (pipeline.description || '');
		setHasChanges(nameChanged || descChanged);
	};

	const handleSubmit = async (values: {
		name: string;
		description: string;
	}) => {
		const updates = {
			name: values.name.trim(),
			description: values.description?.trim() || '',
		};

		// Apply optimistic update
		if (updatePipelineOptimistically) {
			updatePipelineOptimistically(pipeline.id, updates);
		}

		setInternalLoading(true);
		try {
			await updatePipeline(pipeline.id, updates);

			message.success(__('Pipeline updated successfully!', 'quillcrm'));
			setHasChanges(false);
			onUpdate?.();
		} catch (error) {
			// Rollback optimistic update on error
			if (updatePipelineOptimistically) {
				updatePipelineOptimistically(pipeline.id, {
					name: pipeline.name,
					description: pipeline.description,
				});
			}

			message.error(
				error instanceof Error
					? error.message
					: __('Failed to update pipeline', 'quillcrm')
			);
		} finally {
			setInternalLoading(false);
		}
	};

	const handleReset = () => {
		form.setFieldsValue({
			name: pipeline.name,
			description: pipeline.description || '',
		});
		setHasChanges(false);
	};

	return (
		<div className="pipeline-basic-info-form">
			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				onValuesChange={handleFormChange}
				className="pipeline-info-form"
			>
				<Form.Item
					name="name"
					label={__('Pipeline Name', 'quillcrm')}
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

				<Form.Item
					name="description"
					label={__('Description', 'quillcrm')}
					rules={[
						{
							max: 1000,
							message: __(
								'Description must not exceed 1000 characters',
								'quillcrm'
							),
						},
					]}
				>
					<Input.TextArea
						placeholder={__(
							'Enter pipeline description (optional)',
							'quillcrm'
						)}
						rows={4}
						maxLength={1000}
						showCount
					/>
				</Form.Item>

				<div className="form-actions">
					<Button
						type="primary"
						htmlType="submit"
						icon={<Save size={16} />}
						loading={loading}
						disabled={!hasChanges}
						className="save-button"
					>
						{__('Save Changes', 'quillcrm')}
					</Button>

					<Button
						onClick={handleReset}
						disabled={!hasChanges || loading}
					>
						{__('Reset', 'quillcrm')}
					</Button>
				</div>
			</Form>

			{hasChanges && (
				<div className="unsaved-changes-notice">
					<p>
						{__(
							'You have unsaved changes. Click "Save Changes" to update the pipeline.',
							'quillcrm'
						)}
					</p>
				</div>
			)}
		</div>
	);
};
