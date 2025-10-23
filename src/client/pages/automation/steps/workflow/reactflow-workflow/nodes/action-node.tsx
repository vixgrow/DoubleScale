/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import React from 'react';

/**
 * Internal dependencies
 */
import type {
	AutomationStep,
	Automation,
	OrganizedStep,
} from '@quillcrm/client';
import NodeContextMenu from '../components/node-context-menu';
import NodeActionsDropdown from '../components/node-actions-dropdown';
import StepReorderControls from '../components/step-reorder-controls';
import { useAutomationContext } from '../../../../state/context';
import { useDispatch } from '@wordpress/data';
import { deleteStep } from '../utils/step-utils';
import { getAction } from '@quillcrm/utils';
import { ActionIcon } from '@quillcrm/components';

interface ActionNodeData {
	step: AutomationStep;
	automation: Automation;
	selectedStepId?: string | null;
	onStepClick?: (step: OrganizedStep) => void;
	onDeleteStep?: (stepId: string) => void;
}

const ActionNode: React.FC<NodeProps> = (props) => {
	const { data } = props;
	const { step, onStepClick, selectedStepId } = data as unknown as ActionNodeData;

	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	// Check if action is configured - an action is configured if it has an action slug
	const isConfigured = !!step.action;

	// Get action details for display
	const actionData = isConfigured ? getAction(step.action) : null;
	const actionName = actionData?.label || step.action;

	const subtitle = isConfigured ? (
		<span className="qcrm-reactflow-action__configured">{actionName}</span>
	) : (
		<span className="qcrm-reactflow-action__not-configured">
			{__('Not Configured', 'quillcrm')}
		</span>
	);

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

	// Check if this node is selected
	const isSelected = selectedStepId === step.id.toString();

	return (
		<NodeContextMenu onEdit={handleEdit} onDelete={handleDelete}>
			<div className={`qcrm-reactflow-node qcrm-reactflow-node--action ${isSelected ? 'qcrm-reactflow-node--selected' : ''}`}>
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				{/* Step Reorder Controls */}
				<StepReorderControls step={step} />

				<div className="qcrm-reactflow-node__icon">
					<ActionIcon width={23} height={23} />
				</div>
				<div
					className="qcrm-reactflow-node__content"
					style={{ flex: 1, marginRight: '60px' }}
				>
					<div className="qcrm-reactflow-node__title">
						{__('Action', 'quillcrm')}
					</div>
					<div className="qcrm-reactflow-node__subtitle">
						{subtitle}
					</div>
				</div>

				{/* Three dots dropdown menu */}
				<NodeActionsDropdown
					onEdit={handleEdit}
					onDelete={handleDelete}
					editLabel={__('Edit Action', 'quillcrm')}
					deleteLabel={__('Delete Action', 'quillcrm')}
					deleteTitle={__('Delete this action?', 'quillcrm')}
					deleteDescription={__(
						'This will remove the action from your workflow.',
						'quillcrm'
					)}
				/>

				<Handle
					type="source"
					position={Position.Bottom}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
				/>
			</div>
		</NodeContextMenu>
	);
};

export default ActionNode;
