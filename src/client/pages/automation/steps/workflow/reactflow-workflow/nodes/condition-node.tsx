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
	BranchesOutlined,
	EditOutlined,
	DeleteOutlined,
} from '@ant-design/icons';
import { Button, Popconfirm } from 'antd';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';
import NodeContextMenu from '../components/node-context-menu';

interface ConditionNodeData {
	step: AutomationStep;
	onStepClick?: (step: OrganizedStep) => void;
}

const ConditionNode: React.FC<NodeProps> = ({ data }) => {
	const { step, onStepClick } = data as unknown as ConditionNodeData;
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

	return (
		<NodeContextMenu onEdit={handleEdit} onDelete={handleDelete}>
			<div className="qcrm-reactflow-node qcrm-reactflow-node--condition">
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				<div className="qcrm-reactflow-node__header">
					<div className="qcrm-reactflow-node__icon">
						<BranchesOutlined />
					</div>
					<div className="qcrm-reactflow-node__actions">
						<Button
							type="text"
							size="small"
							icon={<EditOutlined />}
							onClick={(e) => {
								e.stopPropagation();
								handleEdit();
							}}
						/>
						<Popconfirm
							title={__('Are you sure?', 'quillcrm')}
							onConfirm={handleDeleteWithStopPropagation}
							okText={__('Yes', 'quillcrm')}
							cancelText={__('No', 'quillcrm')}
							onCancel={(e) => e?.stopPropagation()}
							onOpenChange={(open, e) => {
								if (e) {
									e.stopPropagation();
								}
							}}
						>
							<Button
								type="text"
								size="small"
								icon={<DeleteOutlined />}
								danger
								loading={isDeleting}
								onClick={(e) => e.stopPropagation()}
							/>
						</Popconfirm>
					</div>
				</div>

				<div className="qcrm-reactflow-node__content">
					<div className="qcrm-reactflow-node__title">
						{__('Condition', 'quillcrm')}
					</div>
					<div className="qcrm-reactflow-node__subtitle">
						{step.settings?.condition_name ||
							__('If/Then Logic', 'quillcrm')}
					</div>
				</div>

				{/* Only yes and no handles - no continue handle */}
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
			</div>
		</NodeContextMenu>
	);
};

export default ConditionNode;
