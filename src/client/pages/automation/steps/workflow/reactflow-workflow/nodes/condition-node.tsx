/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
	SettingOutlined,
	EditOutlined,
	DeleteOutlined,
} from '@ant-design/icons';
import { Button, Popconfirm, Tooltip } from 'antd';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';
import NodeContextMenu from '../components/node-context-menu';
import StepReorderControls from '../components/step-reorder-controls';

interface ConditionNodeData {
	step: AutomationStep;
	onStepClick?: (step: OrganizedStep) => void;
	clearSavedPositions?: () => void;
}

const ConditionNode: React.FC<NodeProps> = ({ data }) => {
	const { step, onStepClick, clearSavedPositions } =
		data as unknown as ConditionNodeData;
	const { steps, setSteps } = useAutomationContext();
	const [isDeleting, setIsDeleting] = useState(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const handleEdit = () => {
		if (onStepClick) {
			onStepClick({
				...step,
				children: [], // Will be populated if needed by the consuming component
			});
		}
	};

	const handleDeleteWithStopPropagation = (e?: React.MouseEvent) => {
		if (e) {
			e.stopPropagation();
		}
		handleDelete();
	};

	const getNewSteps = () => {
		const updatedOrdersSteps = {};
		const newSteps = [...steps];

		if (step.parent_id) {
			newSteps
				.filter(
					(child) =>
						child.parent_id === step.parent_id &&
						child.condition === step.condition
				)
				.filter((s) => s.id !== step.id)
				.sort((a, b) => a.order - b.order)
				.forEach((child, index) => {
					const newOrder = index + 1;
					if (newOrder !== child.order) {
						updatedOrdersSteps[child.id] = { order: newOrder };
					}
				});
		} else {
			newSteps
				.sort((a, b) => a.order - b.order)
				.filter((s) => s.id !== step.id)
				.forEach((stepItem, index) => {
					const newOrder = index + 1;
					if (newOrder !== stepItem.order) {
						updatedOrdersSteps[stepItem.id] = { order: newOrder };
					}
				});
		}

		return { updatedOrdersSteps, newSteps };
	};

	const handleDelete = async () => {
		setIsDeleting(true);

		const { newSteps, updatedOrdersSteps } = getNewSteps();

		try {
			await apiFetch({
				path: `/qc/v1/automation-steps/${step.id}`,
				method: 'DELETE',
				data: {
					updated_steps: updatedOrdersSteps,
				},
			});

			const updatedSteps = newSteps.filter((s) => s.id !== step.id);
			setSteps(updatedSteps);

			createNotice({
				type: 'success',
				message: __('Step deleted', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsDeleting(false);
		}
	};

	// Check if condition is configured
	const isConfigured = step.settings?.condition_name;

	return (
		<NodeContextMenu onEdit={handleEdit} onDelete={handleDelete}>
			<div className="qcrm-reactflow-node qcrm-reactflow-node--condition">
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				{/* Node content matching the image design */}
				<div className="qcrm-reactflow-condition__container">
					{/* Left icon section */}
					<div className="qcrm-reactflow-condition__icon-section">
						<SettingOutlined className="qcrm-reactflow-condition__gear-icon" />
					</div>

					{/* Center content section */}
					<div className="qcrm-reactflow-condition__content-section">
						<div className="qcrm-reactflow-condition__title">
							{__('Condition', 'quillcrm')}
						</div>
						<div className="qcrm-reactflow-condition__status">
							{isConfigured ? (
								<span className="qcrm-reactflow-condition__configured">
									{step.settings?.condition_name}
								</span>
							) : (
								<span className="qcrm-reactflow-condition__not-configured">
									{__('Not Configured', 'quillcrm')}
								</span>
							)}
						</div>
					</div>

					{/* Right actions section */}
					<div className="qcrm-reactflow-condition__actions-section">
						<StepReorderControls
							step={step}
							className="qcrm-reactflow-condition__reorder-controls"
							clearSavedPositions={clearSavedPositions}
						/>
						<Tooltip
							title={__('Edit Condition', 'quillcrm')}
							placement="top"
						>
							<Button
								type="text"
								size="small"
								icon={<EditOutlined />}
								onClick={(e) => {
									e.stopPropagation();
									handleEdit();
								}}
								className="qcrm-reactflow-condition__action-btn"
							/>
						</Tooltip>
						<Popconfirm
							title={__('Delete this condition?', 'quillcrm')}
							description={__(
								'This will also remove all connected steps in both branches.',
								'quillcrm'
							)}
							onConfirm={handleDeleteWithStopPropagation}
							okText={__('Delete', 'quillcrm')}
							cancelText={__('Cancel', 'quillcrm')}
							okButtonProps={{ danger: true }}
							onCancel={(e) => e?.stopPropagation()}
							onOpenChange={(_, e) => {
								if (e) {
									e.stopPropagation();
								}
							}}
						>
							<Tooltip
								title={__('Delete Condition', 'quillcrm')}
								placement="top"
							>
								<Button
									type="text"
									size="small"
									icon={<DeleteOutlined />}
									danger
									loading={isDeleting}
									onClick={(e) => e.stopPropagation()}
									className="qcrm-reactflow-condition__action-btn qcrm-reactflow-condition__action-btn--danger"
								/>
							</Tooltip>
						</Popconfirm>
					</div>
				</div>

				{/* Source handles for yes/no branches */}
				<Handle
					type="source"
					position={Position.Left}
					id="yes"
					className="qcrm-reactflow-handle qcrm-reactflow-handle--source qcrm-reactflow-handle--yes"
				/>
				<Handle
					type="source"
					position={Position.Right}
					id="no"
					className="qcrm-reactflow-handle qcrm-reactflow-handle--source qcrm-reactflow-handle--no"
				/>
				{/* Default bottom handle for connecting to parent merge nodes */}
				<Handle
					type="source"
					position={Position.Bottom}
					id="default"
					className="qcrm-reactflow-handle qcrm-reactflow-handle--source qcrm-reactflow-handle--default"
				/>
			</div>
		</NodeContextMenu>
	);
};

export default ConditionNode;
