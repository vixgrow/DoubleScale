/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';
import { getGoal } from '@quillcrm/utils';
import NodeContextMenu from '../components/node-context-menu';
import NodeActionsDropdown from '../components/node-actions-dropdown';
import StepReorderControls from '../components/step-reorder-controls';
import { GoalIcon } from '@quillcrm/components';

interface GoalNodeData {
	step: AutomationStep;
	selectedStepId?: string | null;
	viewMode?: boolean;
	analytics?: { contacts: number; conversion_rate: number };
	onStepClick?: (step: OrganizedStep) => void;
}

const GoalNode: React.FC<NodeProps> = ({ data }) => {
	const { step, onStepClick, selectedStepId, viewMode = false, analytics } = data as unknown as GoalNodeData;
	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	const goal = step.action ? getGoal(step.action) : null;
	const hasGoal = !!step.action;

	const handleEdit = () => {
		if (!viewMode && onStepClick) {
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
		if (viewMode) return;
		
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

	// Check if this node is selected
	const isSelected = selectedStepId === step.id.toString();

	return (
		<NodeContextMenu onEdit={viewMode ? undefined : handleEdit} onDelete={viewMode ? undefined : handleDelete} disabled={viewMode}>
			<div className={`qcrm-reactflow-node qcrm-reactflow-node--goal ${isSelected ? 'qcrm-reactflow-node--selected' : ''} ${viewMode && analytics ? 'qcrm-reactflow-node--action-with-analytics' : ''}`}>
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				{/* Step Reorder Controls - hide in view mode */}
				{!viewMode && <StepReorderControls step={step} />}

				{viewMode && analytics ? (
					<>
						{/* Header Row: Icon, Content, Dropdown */}
						<div className="qcrm-reactflow-node__header-row">
							<div className="qcrm-reactflow-node__header-left">
								<div className="qcrm-reactflow-node__icon">
									<GoalIcon width={23} height={23} />
								</div>
								<div className="qcrm-reactflow-node__content">
									<div className="qcrm-reactflow-node__title">
										{__('Goal', 'quillcrm')}
									</div>
									<div className="qcrm-reactflow-node__subtitle">
										{hasGoal ? (
											<span className="qcrm-reactflow-goal__configured">
												{goal?.label}
											</span>
										) : (
											<span className="qcrm-reactflow-goal__not-configured">
												{__('Goal not set', 'quillcrm')}
											</span>
										)}
									</div>
								</div>
							</div>
							<NodeActionsDropdown
								onEdit={handleEdit}
								onDelete={handleDelete}
								editLabel={__('Edit Goal', 'quillcrm')}
								deleteLabel={__('Delete Goal', 'quillcrm')}
								deleteTitle={__('Delete this goal?', 'quillcrm')}
								deleteDescription={__(
									'This will remove the goal from your workflow.',
									'quillcrm'
								)}
							/>
						</div>

						{/* Footer Row: Analytics */}
						<div className="qcrm-reactflow-node__footer-row">
							<div className="text-sm">
								<span className="text-[#667085]">{__('Contact:', 'quillcrm')} </span>
								<span className="font-semibold text-[#344054]">{analytics.contacts || 0}</span>
							</div>
							<div className="text-sm">
								<span className="text-[#667085]">{__('Conversion Rate:', 'quillcrm')} </span>
								<span className="font-semibold text-[#344054]">{analytics.conversion_rate || 0}%</span>
							</div>
						</div>
					</>
				) : (
					<>
						<div className="qcrm-reactflow-node__icon">
							<GoalIcon width={23} height={23} />
						</div>
						<div className="qcrm-reactflow-node__content">
							<div className="qcrm-reactflow-node__title">
								{__('Goal', 'quillcrm')}
							</div>
							<div className="qcrm-reactflow-node__subtitle">
								{hasGoal ? (
									<span className="qcrm-reactflow-goal__configured">
										{goal?.label}
									</span>
								) : (
									<span className="qcrm-reactflow-goal__not-configured">
										{__('Goal not set', 'quillcrm')}
									</span>
								)}
							</div>
						</div>

						{/* Three dots dropdown menu */}
						<NodeActionsDropdown
							onEdit={handleEdit}
							onDelete={handleDelete}
							editLabel={__('Edit Goal', 'quillcrm')}
							deleteLabel={__('Delete Goal', 'quillcrm')}
							deleteTitle={__('Delete this goal?', 'quillcrm')}
							deleteDescription={__(
								'This will remove the goal from your workflow.',
								'quillcrm'
							)}
						/>
					</>
				)}

				<Handle
					type="source"
					position={Position.Bottom}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
				/>
			</div>
		</NodeContextMenu>
	);
};

export default GoalNode;
