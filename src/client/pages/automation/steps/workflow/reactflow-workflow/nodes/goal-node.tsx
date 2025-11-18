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
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';
import { getGoalLabel, hasGoalWarning } from '@quillcrm/utils';
import NodeContextMenu from '../components/node-context-menu';
import NodeLayout from '../components/node-layout';
import StepReorderControls from '../components/step-reorder-controls';
import { GoalIcon } from '@quillcrm/components';
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
	const { createNotice } = useDispatch('quillcrm/core');

	// Check if goal is configured - a goal is configured if it has an action slug
	const isConfigured = !!step.action;

	// Get goal label and warning status from backend
	const goalName = getGoalLabel(step);
	const hasWarning = hasGoalWarning(step);

	const subtitle = isConfigured ? (
		<div className="flex items-center gap-2">
			<span
				className="qcrm-reactflow-goal__configured"
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
								{__('Plugin Required', 'quillcrm')}
							</p>
							<p className="text-xs mt-1">
								{__(
									'This goal requires a plugin that is not currently active. Please activate the required plugin for this automation to work.',
									'quillcrm'
								)}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	) : (
		<span className="qcrm-reactflow-goal__not-configured">
			{__('Goal not set', 'quillcrm')}
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
		<NodeContextMenu
			onEdit={viewMode ? undefined : handleEdit}
			onDelete={viewMode ? undefined : handleDelete}
			disabled={viewMode}
		>
			<div
				className={`qcrm-reactflow-node qcrm-reactflow-node--goal ${isSelected ? 'qcrm-reactflow-node--selected' : ''} ${viewMode && analytics ? 'qcrm-reactflow-node--action-with-analytics' : ''}`}
			>
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				{/* Step Reorder Controls - hide in view mode */}
				{!viewMode && <StepReorderControls step={step} />}

				<NodeLayout
					icon={<GoalIcon width={23} height={23} />}
					title={__('Goal', 'quillcrm')}
					subtitle={subtitle}
					onEdit={handleEdit}
					onDelete={handleDelete}
					editLabel={__('Edit Goal', 'quillcrm')}
					deleteLabel={__('Delete Goal', 'quillcrm')}
					deleteTitle={__('Delete this goal?', 'quillcrm')}
					deleteDescription={__(
						'This will remove the goal from your workflow.',
						'quillcrm'
					)}
					viewMode={viewMode}
					analytics={analytics}
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

export default GoalNode;
