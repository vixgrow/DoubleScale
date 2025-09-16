/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
	Modal,
	Form,
	Input,
	Button,
	Switch,
	Card,
	Space,
	Row,
	Col,
	Divider,
	ColorPicker,
	InputNumber,
	Tooltip,
	message,
} from 'antd';
import { Plus, Trash2, Info, Palette } from 'lucide-react';

/**
 * Internal dependencies
 */
import { usePipelineOperations } from '../../hooks/use-pipeline-operations';
import './style.scss';

interface Stage {
	name: string;
	color: string;
	win_probability: number;
}

interface NewPipelineModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const DEFAULT_STAGES: Stage[] = [
	{ name: 'Lead', color: '#e74c3c', win_probability: 10 },
	{ name: 'Qualified', color: '#f39c12', win_probability: 25 },
	{ name: 'Proposal', color: '#f1c40f', win_probability: 50 },
	{ name: 'Negotiation', color: '#2ecc71', win_probability: 75 },
	{ name: 'Closed Won', color: '#27ae60', win_probability: 100 },
];

export const NewPipelineModal: React.FC<NewPipelineModalProps> = ({
	visible,
	onClose,
	onSuccess,
}) => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [useCustomStages, setUseCustomStages] = useState(false);
	const [customStages, setCustomStages] = useState<Stage[]>([
		...DEFAULT_STAGES,
	]);
	const { createPipeline } = usePipelineOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	const handleSubmit = async (values: any) => {
		setLoading(true);
		try {
			const pipelineData = {
				name: values.name,
				description: values.description || '',
				stages: useCustomStages ? customStages : [], // Empty array will use backend defaults
			};

			await createPipeline(pipelineData);

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __(
						`Pipeline "${values.name}" created successfully!`,
						'quillcrm'
					),
				});
			}

			form.resetFields();
			setUseCustomStages(false);
			setCustomStages([...DEFAULT_STAGES]);
			onSuccess();
			onClose();
		} catch (error) {
			if (createNotice) {
				createNotice({
					type: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Failed to create pipeline', 'quillcrm'),
				});
			}
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		form.resetFields();
		setUseCustomStages(false);
		setCustomStages([...DEFAULT_STAGES]);
		onClose();
	};

	const addStage = () => {
		const newStage: Stage = {
			name: '',
			color: '#6d78d8',
			win_probability: 0,
		};
		setCustomStages([...customStages, newStage]);
	};

	const removeStage = (index: number) => {
		if (customStages.length > 1) {
			const newStages = customStages.filter((_, i) => i !== index);
			setCustomStages(newStages);
		}
	};

	const updateStage = (index: number, field: keyof Stage, value: any) => {
		const newStages = [...customStages];
		newStages[index] = {
			...newStages[index],
			[field]: value,
		};
		setCustomStages(newStages);
	};

	const resetToDefaults = () => {
		setCustomStages([...DEFAULT_STAGES]);
	};

	return (
		<Modal
			title={
				<div className="modal-title">
					<Plus size={20} />
					<span>{__('Create New Pipeline', 'quillcrm')}</span>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			width={800}
			footer={
				<div className="modal-footer">
					<Button onClick={handleCancel}>
						{__('Cancel', 'quillcrm')}
					</Button>
					<Button
						type="primary"
						onClick={() => form.submit()}
						loading={loading}
					>
						{__('Create Pipeline', 'quillcrm')}
					</Button>
				</div>
			}
			className="new-pipeline-modal"
		>
			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				className="new-pipeline-form"
			>
				{/* Basic Information */}
				<Card
					title={__('Basic Information', 'quillcrm')}
					className="form-section"
				>
					<Row gutter={16}>
						<Col span={24}>
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
											'Pipeline name must not exceed 255 characters',
											'quillcrm'
										),
									},
								]}
							>
								<Input
									placeholder={__(
										'e.g., Sales Pipeline, Lead Nurturing',
										'quillcrm'
									)}
									maxLength={255}
								/>
							</Form.Item>
						</Col>
						<Col span={24}>
							<Form.Item
								name="description"
								label={__('Description', 'quillcrm')}
							>
								<Input.TextArea
									placeholder={__(
										'Optional description for this pipeline',
										'quillcrm'
									)}
									rows={3}
									maxLength={500}
								/>
							</Form.Item>
						</Col>
					</Row>
				</Card>

				{/* Stage Configuration */}
				<Card
					title={
						<div className="card-title-with-info">
							<span>{__('Stage Configuration', 'quillcrm')}</span>
							<Tooltip
								title={__(
									'You can use the default 5-stage sales pipeline or create custom stages',
									'quillcrm'
								)}
							>
								<Info size={16} className="info-icon" />
							</Tooltip>
						</div>
					}
					className="form-section"
				>
					<div className="stage-config-header">
						<div className="stage-switch">
							<Switch
								checked={useCustomStages}
								onChange={setUseCustomStages}
								size="small"
							/>
							<span className="switch-label">
								{__('Customize stages', 'quillcrm')}
							</span>
						</div>

						{!useCustomStages && (
							<div className="default-stages-info">
								<p className="info-text">
									{__(
										'Using default 5-stage sales pipeline:',
										'quillcrm'
									)}{' '}
									Lead → Qualified → Proposal → Negotiation →
									Closed Won
								</p>
							</div>
						)}
					</div>

					{useCustomStages && (
						<div className="custom-stages-config">
							<div className="stages-header">
								<Space>
									<Button
										type="dashed"
										icon={<Plus size={16} />}
										onClick={addStage}
										size="small"
									>
										{__('Add Stage', 'quillcrm')}
									</Button>
									<Button
										type="link"
										onClick={resetToDefaults}
										size="small"
									>
										{__('Reset to Defaults', 'quillcrm')}
									</Button>
								</Space>
							</div>

							<Divider style={{ margin: '12px 0' }} />

							<div className="stages-list">
								{customStages.map((stage, index) => (
									<Card
										key={index}
										size="small"
										className="stage-card"
										title={
											<div className="stage-card-title">
												<span>
													{__('Stage', 'quillcrm')}{' '}
													{index + 1}
												</span>
												{customStages.length > 1 && (
													<Button
														type="text"
														icon={
															<Trash2 size={14} />
														}
														onClick={() =>
															removeStage(index)
														}
														className="remove-stage-btn"
														size="small"
													/>
												)}
											</div>
										}
									>
										<Row gutter={12}>
											<Col span={10}>
												<div className="form-item-compact">
													<label className="form-label">
														{__(
															'Stage Name',
															'quillcrm'
														)}
													</label>
													<Input
														value={stage.name}
														onChange={(e) =>
															updateStage(
																index,
																'name',
																e.target.value
															)
														}
														placeholder={__(
															'Enter stage name',
															'quillcrm'
														)}
														maxLength={255}
														size="small"
													/>
												</div>
											</Col>
											<Col span={6}>
												<div className="form-item-compact">
													<label className="form-label">
														<Palette
															size={14}
															style={{
																marginRight: 4,
															}}
														/>
														{__(
															'Color',
															'quillcrm'
														)}
													</label>
													<ColorPicker
														value={stage.color}
														onChange={(color) =>
															updateStage(
																index,
																'color',
																color.toHexString()
															)
														}
														size="small"
														showText
														format="hex"
													/>
												</div>
											</Col>
											<Col span={8}>
												<div className="form-item-compact">
													<label className="form-label">
														{__(
															'Win Probability (%)',
															'quillcrm'
														)}
													</label>
													<InputNumber
														value={
															stage.win_probability
														}
														onChange={(value) =>
															updateStage(
																index,
																'win_probability',
																value || 0
															)
														}
														min={0}
														max={100}
														style={{
															width: '100%',
														}}
														size="small"
														placeholder="0-100"
													/>
												</div>
											</Col>
										</Row>
									</Card>
								))}
							</div>

							<div className="stages-footer">
								<p className="help-text">
									{__(
										'Tip: Arrange stages in order from initial contact to deal closure. Win probability helps with pipeline forecasting.',
										'quillcrm'
									)}
								</p>
							</div>
						</div>
					)}
				</Card>
			</Form>
		</Modal>
	);
};
