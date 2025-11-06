/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { 
	List, 
	Button, 
	Popconfirm, 
	Input, 
	Space,
	Tag,
	message,
	Modal,
	Form,
	Slider,
	ColorPicker,
} from 'antd';
import { 
	GripVertical, 
	Edit3, 
	Trash2, 
	Save,
	X,
} from 'lucide-react';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Internal dependencies
 */
import './style.scss';

interface Stage {
	id: number;
	pipeline_id: number;
	name: string;
	color: string;
	sort_order: number;
	win_probability: number;
	deal_count?: number;
	total_value?: number;
}

interface StageListManagerProps {
	stages: Stage[];
	onStageUpdate: (stageId: number, stageData: {
		name?: string;
		color?: string;
		win_probability?: number;
	}) => Promise<void>;
	onStageDelete: (stageId: number) => Promise<void>;
	onStageReorder: (stageIds: number[]) => Promise<void>;
	loading?: boolean;
}

interface SortableStageItemProps {
	stage: Stage;
	onEdit: () => void;
	onDelete: () => void;
	isEditing: boolean;
	onSave: (data: { name: string; color: string; win_probability: number }) => void;
	onCancelEdit: () => void;
}

const SortableStageItem: React.FC<SortableStageItemProps> = ({
	stage,
	onEdit,
	onDelete,
	isEditing,
	onSave,
	onCancelEdit,
}) => {
	const [editForm] = Form.useForm();
	const [editingData, setEditingData] = useState({
		name: stage.name,
		color: stage.color,
		win_probability: stage.win_probability,
	});

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: stage.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const handleSave = () => {
		editForm.validateFields().then((values) => {
			onSave({
				name: values.name.trim(),
				color: editingData.color,
				win_probability: values.win_probability,
			});
		}).catch((error) => {
			console.error('Validation failed:', error);
		});
	};

	const handleColorChange = (color: any) => {
		const hexColor = typeof color === 'string' ? color : color.toHexString();
		setEditingData(prev => ({ ...prev, color: hexColor }));
	};

	if (isEditing) {
		return (
			<div ref={setNodeRef} style={style} className="stage-item editing">
				<Form
					form={editForm}
					layout="vertical"
					initialValues={{
						name: stage.name,
						win_probability: stage.win_probability,
					}}
					className="edit-form"
				>
					<div className="edit-content">
						<div className="edit-basic-info">
							<Form.Item
								name="name"
								rules={[
									{ required: true, message: __('Stage name is required', 'quillcrm') },
									{ max: 255, message: __('Stage name too long', 'quillcrm') },
								]}
								style={{ flex: 1, marginBottom: 8 }}
							>
								<Input 
									placeholder={__('Stage name', 'quillcrm')}
									size="small"
								/>
							</Form.Item>
							
							<div className="color-picker-section">
								<ColorPicker
									value={editingData.color}
									onChange={handleColorChange}
									size="small"
								/>
								<span className="color-value">{editingData.color}</span>
							</div>
						</div>
						
						<Form.Item
							name="win_probability"
							label={__('Win Probability', 'quillcrm')}
							style={{ marginBottom: 8 }}
						>
							<Slider
								min={0}
								max={100}
								step={5}
								size="small"
								tooltip={{ formatter: (value) => `${value}%` }}
							/>
						</Form.Item>
						
						<div className="edit-actions">
							<Space size="small">
								<Button
									type="primary"
									size="small"
									icon={<Save size={14} />}
									onClick={handleSave}
								>
									{__('Save', 'quillcrm')}
								</Button>
								<Button
									type="default"
									size="small"
									icon={<X size={14} />}
									onClick={onCancelEdit}
								>
									{__('Cancel', 'quillcrm')}
								</Button>
							</Space>
						</div>
					</div>
				</Form>
			</div>
		);
	}

	return (
		<div ref={setNodeRef} style={style} {...attributes} className="stage-item">
			<div className="stage-drag-handle" {...listeners}>
				<GripVertical size={16} />
			</div>
			
			<div className="stage-info">
				<div className="stage-header">
					<div
						className="stage-color"
						style={{ backgroundColor: stage.color }}
					/>
					<span className="stage-name">{stage.name}</span>
					<Tag color="default">
						{stage.win_probability}% {__('win rate', 'quillcrm')}
					</Tag>
				</div>
				
				{(stage.deal_count !== undefined || stage.total_value !== undefined) && (
					<div className="stage-stats">
						{stage.deal_count !== undefined && (
							<span className="stat">
								{stage.deal_count} {stage.deal_count === 1 ? __('deal', 'quillcrm') : __('deals', 'quillcrm')}
							</span>
						)}
						{stage.total_value !== undefined && (
							<span className="stat">
								${stage.total_value.toLocaleString()}
							</span>
						)}
					</div>
				)}
			</div>
			
			<div className="stage-actions">
				<Space size="small">
					<Button
						type="text"
						size="small"
						icon={<Edit3 size={14} />}
						onClick={onEdit}
						title={__('Edit stage', 'quillcrm')}
					/>
					<Popconfirm
						title={__('Delete Stage', 'quillcrm')}
						description={__('Are you sure you want to delete this stage? This action cannot be undone.', 'quillcrm')}
						onConfirm={onDelete}
						okText={__('Delete', 'quillcrm')}
						cancelText={__('Cancel', 'quillcrm')}
						okButtonProps={{ danger: true }}
					>
						<Button
							type="text"
							size="small"
							icon={<Trash2 size={14} />}
							danger
							title={__('Delete stage', 'quillcrm')}
						/>
					</Popconfirm>
				</Space>
			</div>
		</div>
	);
};

export const StageListManager: React.FC<StageListManagerProps> = ({
	stages,
	onStageUpdate,
	onStageDelete,
	onStageReorder,
	loading = false,
}) => {
	const [editingStageId, setEditingStageId] = useState<number | null>(null);
	const [sortedStages, setSortedStages] = useState(stages);

	// Update sorted stages when props change
	React.useEffect(() => {
		setSortedStages([...stages].sort((a, b) => a.sort_order - b.sort_order));
	}, [stages]);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = sortedStages.findIndex((stage) => stage.id === active.id);
			const newIndex = sortedStages.findIndex((stage) => stage.id === over.id);

			const newSortedStages = arrayMove(sortedStages, oldIndex, newIndex);
			setSortedStages(newSortedStages);

			// Call the reorder function with the new order
			try {
				await onStageReorder(newSortedStages.map(stage => stage.id));
				message.success(__('Stages reordered successfully!', 'quillcrm'));
			} catch (error) {
				console.error('Failed to reorder stages:', error);
				// Revert the local change
				setSortedStages(sortedStages);
				message.error(__('Failed to reorder stages. Please try again.', 'quillcrm'));
			}
		}
	};

	const handleEdit = (stageId: number) => {
		setEditingStageId(stageId);
	};

	const handleSave = async (stageId: number, data: { name: string; color: string; win_probability: number }) => {
		try {
			await onStageUpdate(stageId, data);
			setEditingStageId(null);
			message.success(__('Stage updated successfully!', 'quillcrm'));
		} catch (error) {
			console.error('Failed to update stage:', error);
			message.error(error instanceof Error ? error.message : __('Failed to update stage', 'quillcrm'));
		}
	};

	const handleCancelEdit = () => {
		setEditingStageId(null);
	};

	const handleDelete = async (stageId: number) => {
		try {
			await onStageDelete(stageId);
			message.success(__('Stage deleted successfully!', 'quillcrm'));
		} catch (error) {
			console.error('Failed to delete stage:', error);
			message.error(error instanceof Error ? error.message : __('Failed to delete stage', 'quillcrm'));
		}
	};

	if (sortedStages.length === 0) {
		return (
			<div className="stage-list-empty">
				<p>{__('No stages in this pipeline yet.', 'quillcrm')}</p>
			</div>
		);
	}

	return (
		<div className="stage-list-manager">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={sortedStages.map(stage => stage.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="stage-list">
						{sortedStages.map((stage) => (
							<SortableStageItem
								key={stage.id}
								stage={stage}
								onEdit={() => handleEdit(stage.id)}
								onDelete={() => handleDelete(stage.id)}
								isEditing={editingStageId === stage.id}
								onSave={(data) => handleSave(stage.id, data)}
								onCancelEdit={handleCancelEdit}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
};