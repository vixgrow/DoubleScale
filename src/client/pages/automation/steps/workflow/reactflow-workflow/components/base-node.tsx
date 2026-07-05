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
import type { AutomationStep, OrganizedStep } from '@doublescale/client';
import NodeContextMenu from './node-context-menu';
import NodeActionsDropdown from './node-actions-dropdown';
import SortableNodeContainer from './sortable-node-container';
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
		editLabel = __('Edit Step', 'doublescale'),
		deleteLabel = __('Delete Step', 'doublescale'),
		deleteTitle = __('Delete this step?', 'doublescale'),
		deleteDescription = __(
			'This will remove the step from your workflow.',
			'doublescale'
		),
		showSourceHandle = true,
		showTargetHandle = true,
		additionalHandles,
		className = '',
	} = data as unknown as BaseNodeData;

	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('doublescale/core');

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
			<SortableNodeContainer
				step={step}
				className={`doublescale-reactflow-node ${className}`}
			>
				{showTargetHandle && (
					<Handle
						type="target"
						position={Position.Top}
						className="doublescale-reactflow-handle doublescale-reactflow-handle--target"
					/>
				)}

				<div className="doublescale-reactflow-node__icon">{icon}</div>
				<div
					className="doublescale-reactflow-node__content"
					style={{ flex: 1, marginRight: '60px' }}
				>
					<div className="doublescale-reactflow-node__title">{title}</div>
					<div className="doublescale-reactflow-node__subtitle">
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
						className="doublescale-reactflow-handle doublescale-reactflow-handle--source"
					/>
				)}

				{/* Additional handles (e.g., for condition nodes) */}
				{additionalHandles}
			</SortableNodeContainer>
		</NodeContextMenu>
	);
};

export default BaseNode;
