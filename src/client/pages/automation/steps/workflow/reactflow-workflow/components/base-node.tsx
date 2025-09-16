/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import React from 'react';

/**
 * Internal dependencies
 */
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';
import NodeContextMenu from './node-context-menu';
import NodeActionsDropdown from './node-actions-dropdown';
import StepReorderControls from './step-reorder-controls';
import { useAutomationContext } from '../../../../state/context';
import { deleteStep } from '../utils/step-utils';

export interface BaseNodeData {
	step: AutomationStep;
	onStepClick?: (step: OrganizedStep) => void;
	icon: React.ReactNode;
	title: string;
	subtitle: React.ReactNode;
	editLabel?: string;
	deleteLabel?: string;
	deleteTitle?: string;
	deleteDescription?: string;
	showSourceHandle?: boolean;
	showTargetHandle?: boolean;
	additionalHandles?: React.ReactNode;
	className?: string;
}

const BaseNode: React.FC<NodeProps> = ({ data }) => {
	const {
		step,
		onStepClick,
		icon,
		title,
		subtitle,
		editLabel = __('Edit Step', 'quillcrm'),
		deleteLabel = __('Delete Step', 'quillcrm'),
		deleteTitle = __('Delete this step?', 'quillcrm'),
		deleteDescription = __(
			'This will remove the step from your workflow.',
			'quillcrm'
		),
		showSourceHandle = true,
		showTargetHandle = true,
		additionalHandles,
		className = '',
	} = data as unknown as BaseNodeData;

	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	const handleEdit = () => {
		if (onStepClick) {
			onStepClick({
				...step,
				children: [], // Will be populated if needed by the consuming component
			});
		}
	};

	const handleDelete = async () => {
		await deleteStep(step.id.toString(), steps, setSteps, createNotice);
	};

	return (
		<NodeContextMenu onEdit={handleEdit} onDelete={handleDelete}>
			<div className={`qcrm-reactflow-node ${className}`}>
				{showTargetHandle && (
					<Handle
						type="target"
						position={Position.Top}
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
					/>
				)}

				{/* Step Reorder Controls */}
				<StepReorderControls step={step} />

				<div className="qcrm-reactflow-node__icon">{icon}</div>
				<div
					className="qcrm-reactflow-node__content"
					style={{ flex: 1, marginRight: '60px' }}
				>
					<div className="qcrm-reactflow-node__title">{title}</div>
					<div className="qcrm-reactflow-node__subtitle">
						{subtitle}
					</div>
				</div>

				{/* Three dots dropdown menu */}
				<NodeActionsDropdown
					onEdit={handleEdit}
					onDelete={handleDelete}
					editLabel={editLabel}
					deleteLabel={deleteLabel}
					deleteTitle={deleteTitle}
					deleteDescription={deleteDescription}
				/>

				{showSourceHandle && (
					<Handle
						type="source"
						position={Position.Bottom}
						className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
					/>
				)}

				{/* Additional handles (e.g., for condition nodes) */}
				{additionalHandles}
			</div>
		</NodeContextMenu>
	);
};

export default BaseNode;
