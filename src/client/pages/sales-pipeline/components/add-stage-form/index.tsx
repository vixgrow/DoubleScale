/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { 
	Button, 
	Input, 
	Form, 
	Slider, 
	ColorPicker, 
	Space,
	Row,
	Col,
	message,
} from 'antd';
import { Plus } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';

interface AddStageFormProps {
	pipelineId: number;
	existingStages: Array<{
		id: number;
		name: string;
		color: string;
		sort_order: number;
		win_probability: number;
	}>;
	onStageAdd: (stageData: {
		name: string;
		color: string;
		win_probability: number;
		position?: number;
	}) => Promise<void>;
	onCancel?: () => void;
	loading?: boolean;
}

export const AddStageForm: React.FC<AddStageFormProps> = ({
	pipelineId,
	existingStages,
	onStageAdd,
	onCancel,
	loading = false,
}) => {
	const [form] = Form.useForm();
	const [colorPickerVisible, setColorPickerVisible] = useState(false);
	const [selectedColor, setSelectedColor] = useState('#6d78d8');

	// Color presets for quick selection
	const colorPresets = [
		'#e74c3c', // Red
		'#f39c12', // Orange
		'#f1c40f', // Yellow
		'#2ecc71', // Green
		'#27ae60', // Dark Green
		'#3498db', // Blue
		'#6d78d8', // Purple
		'#9b59b6', // Violet
		'#e91e63', // Pink
		'#795548', // Brown
	];

	const handleSubmit = async (values: any) => {
		try {
			await onStageAdd({
				name: values.name.trim(),
				color: selectedColor,
				win_probability: values.win_probability || 0,
				position: values.position,
			});

			// Reset form after successful submission
			form.resetFields();
			setSelectedColor('#6d78d8');
			message.success(__('Stage added successfully!', 'quillcrm'));
		} catch (error) {
			console.error('Failed to add stage:', error);
			message.error(error instanceof Error ? error.message : __('Failed to add stage', 'quillcrm'));
		}
	};

	const handleColorChange = (color: any) => {
		const hexColor = typeof color === 'string' ? color : color.toHexString();
		setSelectedColor(hexColor);
		form.setFieldValue('color', hexColor);
	};

	return (
		<div className="add-stage-form">
			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				initialValues={{
					win_probability: 0,
					color: selectedColor,
				}}
			>
				{/* Stage Name */}
				<Form.Item
					name="name"
					label={__('Stage Name', 'quillcrm')}
					rules={[
						{ required: true, message: __('Stage name is required', 'quillcrm') },
						{ max: 255, message: __('Stage name must not exceed 255 characters', 'quillcrm') },
						{ 
							validator: (_, value) => {
								if (value && existingStages.some(stage => stage.name.toLowerCase() === value.toLowerCase())) {
									return Promise.reject(new Error(__('A stage with this name already exists', 'quillcrm')));
								}
								return Promise.resolve();
							}
						}
					]}
				>
					<Input 
						placeholder={__('Enter stage name...', 'quillcrm')}
						size="large"
					/>
				</Form.Item>

				{/* Stage Color */}
				<Form.Item
					name="color"
					label={__('Stage Color', 'quillcrm')}
				>
					<div className="color-selection">
						<Row gutter={[8, 8]} className="color-presets">
							{colorPresets.map((color) => (
								<Col key={color}>
									<div
										className={`color-preset ${selectedColor === color ? 'selected' : ''}`}
										style={{ backgroundColor: color }}
										onClick={() => handleColorChange(color)}
										title={color}
									/>
								</Col>
							))}
						</Row>
						
						<div className="custom-color-section">
							<Button 
								type="dashed"
								onClick={() => setColorPickerVisible(!colorPickerVisible)}
								className="custom-color-button"
							>
								{__('Custom Color', 'quillcrm')}
							</Button>
							
							{colorPickerVisible && (
								<div className="color-picker-wrapper">
									<ColorPicker
										value={selectedColor}
										onChange={handleColorChange}
										showText
									/>
								</div>
							)}
						</div>

						{/* Selected Color Preview */}
						<div className="selected-color-preview">
							<div
								className="color-preview"
								style={{ backgroundColor: selectedColor }}
							/>
							<span className="color-value">{selectedColor}</span>
						</div>
					</div>
				</Form.Item>

				{/* Win Probability */}
				<Form.Item
					name="win_probability"
					label={__('Win Probability (%)', 'quillcrm')}
					tooltip={__('The percentage likelihood that deals in this stage will be won', 'quillcrm')}
				>
					<Slider
						min={0}
						max={100}
						step={5}
						marks={{
							0: '0%',
							25: '25%',
							50: '50%',
							75: '75%',
							100: '100%',
						}}
						tooltip={{
							formatter: (value) => `${value}%`,
						}}
					/>
				</Form.Item>

				{/* Position (Optional) */}
				<Form.Item
					name="position"
					label={__('Insert Position', 'quillcrm')}
					tooltip={__('Leave empty to add at the end, or specify a position (0 = first)', 'quillcrm')}
				>
					<Input
						type="number"
						min={0}
						max={existingStages.length}
						placeholder={__('Position (optional)', 'quillcrm')}
					/>
				</Form.Item>

				{/* Form Actions */}
				<Form.Item className="form-actions">
					<Space>
						<Button
							type="primary"
							htmlType="submit"
							loading={loading}
							icon={<Plus size={16} />}
						>
							{__('Add Stage', 'quillcrm')}
						</Button>
						
						{onCancel && (
							<Button
								type="default"
								onClick={onCancel}
								disabled={loading}
							>
								{__('Cancel', 'quillcrm')}
							</Button>
						)}
					</Space>
				</Form.Item>
			</Form>
		</div>
	);
};