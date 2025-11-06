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
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';
import NodeContextMenu from '../components/node-context-menu';
import NodeLayout from '../components/node-layout';
import StepReorderControls from '../components/step-reorder-controls';
import { useAutomationContext } from '../../../../state/context';
import { useDispatch } from '@wordpress/data';
import { deleteStep } from '../utils/step-utils';
import { ConditionsIcon } from '@quillcrm/components';

interface ConditionNodeData {
	step: AutomationStep;
	selectedStepId?: string | null;
	viewMode?: boolean;
	analytics?: { contacts: number; conversion_rate: number };
	onStepClick?: (step: OrganizedStep) => void;
}

const ConditionNode: React.FC<NodeProps> = (props) => {
	const { data } = props;
	const { step, onStepClick, selectedStepId, viewMode = false, analytics } = data as unknown as ConditionNodeData;

	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	// Check if condition is configured - a condition is configured if it has rules
	const isConfigured =
		step.settings &&
		Array.isArray(step.settings) &&
		step.settings.length > 0;

	const subtitle = isConfigured ? (
		<span className="qcrm-reactflow-condition__configured">
			{__('Configured', 'quillcrm')}
		</span>
	) : (
		<span className="qcrm-reactflow-condition__not-configured">
			{__('Not Configured', 'quillcrm')}
		</span>
	);

	const handleEdit = () => {
		if (!viewMode && onStepClick) {
			onStepClick({
				...step,
				children: [], // Will be populated if needed by the consuming component
			});
		}
	};

	const handleDelete = async () => {
		if (!viewMode) {
			await deleteStep(step.id.toString(), steps, setSteps, createNotice);
		}
	};

	// Check if this node is selected
	const isSelected = selectedStepId === step.id.toString();

	return (
		<NodeContextMenu onEdit={viewMode ? undefined : handleEdit} onDelete={viewMode ? undefined : handleDelete} disabled={viewMode}>
			<div className={`qcrm-reactflow-node qcrm-reactflow-node--condition ${isSelected ? 'qcrm-reactflow-node--selected' : ''} ${viewMode && analytics ? 'qcrm-reactflow-node--action-with-analytics' : ''}`}>
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				{/* Step Reorder Controls - hide in view mode */}
				{!viewMode && <StepReorderControls step={step} />}

				<NodeLayout
					icon={<ConditionsIcon width={23} height={23} />}
					title={__('Condition', 'quillcrm')}
					subtitle={subtitle}
					onEdit={handleEdit}
					onDelete={handleDelete}
					editLabel={__('Edit Condition', 'quillcrm')}
					deleteLabel={__('Delete Condition', 'quillcrm')}
					deleteTitle={__('Delete this condition?', 'quillcrm')}
					deleteDescription={__(
						'This will also remove all connected steps in both branches.',
						'quillcrm'
					)}
					viewMode={viewMode}
					analytics={analytics}
				/>

				{/* Separate source handles for yes and no branches */}
				<Handle
					type="source"
					position={Position.Bottom}
					id="yes"
					className="qcrm-reactflow-handle qcrm-reactflow-handle--source qcrm-reactflow-handle--yes"
				/>
				<Handle
					type="source"
					position={Position.Bottom}
					id="no"
					className="qcrm-reactflow-handle qcrm-reactflow-handle--source qcrm-reactflow-handle--no"
				/>
			</div>
		</NodeContextMenu>
	);
};

export default ConditionNode;
