/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import apiFetch from '@wordpress/api-fetch';

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
import { getAction } from '@quillcrm/utils';

interface ActionNodeData {
	step: AutomationStep;
	automation: Automation;
	onStepClick?: (step: OrganizedStep) => void;
	onDeleteStep?: (stepId: string) => void;
}

const ActionNode: React.FC<NodeProps> = ({ data }) => {
	const { step, onStepClick } = data as unknown as ActionNodeData;
	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	const ActionIcon = () => (
		<svg
			width="16"
			height="23"
			viewBox="0 0 16 23"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M8.89682 1.92518L1.9282 11.3173C1.87461 11.3896 1.85434 11.5105 1.89889 11.6274C1.91078 11.6586 1.92368 11.6789 1.93287 11.6908H5.30393C6.41744 11.6908 7.07754 12.7056 7.07754 13.6316V20.9321C7.07754 20.9991 7.08993 21.0452 7.10266 21.0749L14.0713 11.6827C14.1249 11.6105 14.1451 11.4896 14.1006 11.3727C14.0887 11.3415 14.0758 11.3212 14.0666 11.3093H10.6955C9.58204 11.3093 8.92194 10.2945 8.92194 9.36848V2.06796C8.92194 2.00103 8.90955 1.95491 8.89682 1.92518ZM9.57303 0.272146C10.2403 0.570786 10.6719 1.26287 10.6719 2.06796V9.36848C10.6719 9.46601 10.7056 9.53025 10.7291 9.55807C10.7294 9.55848 10.7298 9.55888 10.7301 9.55926H14.0994C14.9483 9.55926 15.5101 10.1571 15.7358 10.7494C15.963 11.3453 15.9339 12.1093 15.4767 12.7255L8.47843 22.1576C7.96043 22.8557 7.12638 23.0412 6.42645 22.7279C5.75917 22.4293 5.32754 21.7372 5.32754 20.9321V13.6316C5.32754 13.5341 5.29385 13.4698 5.27039 13.442C5.27004 13.4416 5.26971 13.4412 5.26938 13.4408H1.90009C1.05117 13.4408 0.489405 12.843 0.26365 12.2507C0.0365179 11.6548 0.0655637 10.8908 0.522799 10.2746L7.52105 0.842495C8.03905 0.144339 8.87309 -0.0411119 9.57303 0.272146Z"
				fill="currentColor"
			/>
		</svg>
	);

	const handleEdit = () => {
		if (onStepClick) {
			onStepClick({
				...step,
				children: [], // Will be populated if needed by the consuming component
			});
		}
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
		}
	};

	// Check if action is configured - an action is configured if it has an action slug
	const isConfigured = !!step.action;

	// Get action details for display
	const actionData = isConfigured ? getAction(step.action) : null;
	const actionName = actionData?.label || step.action;

	return (
		<NodeContextMenu onEdit={handleEdit} onDelete={handleDelete}>
			<div className="qcrm-reactflow-node qcrm-reactflow-node--action">
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				{/* Step Reorder Controls */}
				<StepReorderControls step={step} />

				<div className="qcrm-reactflow-node__icon">
					<ActionIcon />
				</div>
				<div
					className="qcrm-reactflow-node__content"
					style={{ flex: 1, marginRight: '60px' }}
				>
					<div className="qcrm-reactflow-node__title">
						{__('Start Workflow (Action)', 'quillcrm')}
					</div>
					<div className="qcrm-reactflow-node__subtitle">
						{isConfigured ? (
							<span className="qcrm-reactflow-action__configured">
								{actionName}
							</span>
						) : (
							<span className="qcrm-reactflow-action__not-configured">
								{__('Not Configured', 'quillcrm')}
							</span>
						)}
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
