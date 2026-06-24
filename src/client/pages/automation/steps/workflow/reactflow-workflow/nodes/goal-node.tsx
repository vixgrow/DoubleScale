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
import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import type { AutomationStep, OrganizedStep } from '@doublescale/client';
import {
	getGoalLabel,
	hasGoalWarning,
	getGoalWarningMessage,
} from '@doublescale/utils';
import NodeContextMenu from '../components/node-context-menu';
import NodeLayout from '../components/node-layout';
import StepReorderControls from '../components/step-reorder-controls';
import { duplicateStep } from '../utils/step-utils';
import { GoalIcon, GoalsAutomationIcon } from '@doublescale/components';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface GoalNodeData {
	step: AutomationStep;
	selectedStepId?: string | null;
	viewMode?: boolean;
	analytics?: { contacts: number; conversion_rate: number };
	onStepClick?: (step: OrganizedStep) => void;
}

const GoalNode: React.FC<NodeProps> = ({ data }) => {
	const {
		step,
		onStepClick,
		selectedStepId,
		viewMode = false,
		analytics,
	} = data as unknown as GoalNodeData;
	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('doublescale/core');

	// Check if goal is configured - a goal is configured if it has an action slug
	const isConfigured = !!step.action;

	// Get goal label and warning status from backend
	const goalName = getGoalLabel(step);
	const hasWarning = hasGoalWarning(step);
	const warningMessage = getGoalWarningMessage(step);

	const subtitle = isConfigured ? (
		<div className="flex items-center gap-2">
			<span
				className="doublescale-reactflow-goal__configured"
				style={{ color: hasWarning ? '#f59e0b' : 'inherit' }}
			>
				{goalName}
			</span>
			{hasWarning && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<AlertTriangle className="h-4 w-4 text-orange-500" />
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-xs">
							<p className="font-semibold">
								{__('Plugin Required', 'doublescale')}
							</p>
							<p className="text-xs mt-1">{warningMessage}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	) : (
		<span className="doublescale-reactflow-goal__not-configured">
			{__('Goal not set', 'doublescale')}
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
				path: `/doublescale/v1/automation-steps/${step.id}`,
				method: 'DELETE',
				data: {
					updated_steps: updatedOrdersSteps,
				},
			});

			const updatedSteps = newSteps.filter((s) => s.id !== step.id);
			setSteps(updatedSteps);

			createNotice({
				type: 'success',
				message: __('Step deleted', 'doublescale'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const handleDuplicate = async () => {
		if (!viewMode) {
			await duplicateStep(
				step,
				steps,
				setSteps,
				createNotice,
				__('Goal duplicated', 'doublescale')
			);
		}
	};

	// Check if this node is selected
	const isSelected = selectedStepId === step.id.toString();

	return (
		<NodeContextMenu
			onEdit={viewMode ? undefined : handleEdit}
			onDelete={viewMode ? undefined : handleDelete}
			disabled={viewMode}
		>
			<div
				className={`doublescale-reactflow-node doublescale-reactflow-node--goal doublescale-reactflow-node--card-layout ${isSelected ? 'doublescale-reactflow-node--selected' : ''} ${viewMode && analytics ? 'doublescale-reactflow-node--action-with-analytics' : ''}`}
			>
				<Handle
					type="target"
					position={Position.Top}
					className="doublescale-reactflow-handle doublescale-reactflow-handle--target"
				/>

				{/* Step Reorder Controls - hide in view mode */}
				{!viewMode && <StepReorderControls step={step} />}

				<NodeLayout
					variant="goal"
					icon={<GoalsAutomationIcon width={24} height={24} />}
					title={__('Goal', 'doublescale')}
					subtitle={subtitle}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onDuplicate={handleDuplicate}
					editLabel={__('Edit Goal', 'doublescale')}
					deleteLabel={__('Delete Goal', 'doublescale')}
					duplicateLabel={__('Duplicate Goal', 'doublescale')}
					showDuplicate={isConfigured}
					deleteTitle={__('Delete this goal?', 'doublescale')}
					deleteDescription={__(
						'This will remove the goal from your workflow.',
						'doublescale'
					)}
					viewMode={viewMode}
					analytics={analytics}
				/>

				<Handle
					type="source"
					position={Position.Bottom}
					className="doublescale-reactflow-handle doublescale-reactflow-handle--source"
				/>
			</div>
		</NodeContextMenu>
	);
};

export default GoalNode;
