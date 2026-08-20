/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import React from 'react';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import type { AutomationStep, OrganizedStep } from '@doublescale/client';
import {
	getCatalogGoalLabel,
	getGoalLabel,
	hasGoalWarning,
	getGoalWarningMessage,
} from '@doublescale/utils';
import NodeContextMenu from '../components/node-context-menu';
import NodeLayout from '../components/node-layout';
import SortableNodeContainer from '../components/sortable-node-container';
import RenameActionDialog from '../components/rename-action-dialog';
import {
	duplicateStep,
	isStepDisabled,
	toggleStepEnabled,
} from '../utils/step-utils';
import { updateStepCustomLabel } from '../utils/canvas-notes-utils';
import { AlertTriangleIcon, GoalsAutomationIcon } from '@doublescale/components';
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
	onClearStep?: () => void;
}

const GoalNode: React.FC<NodeProps> = ({ data }) => {
	const {
		step,
		onStepClick,
		onClearStep,
		selectedStepId,
		viewMode = false,
		analytics,
	} = data as unknown as GoalNodeData;
	const { steps, setSteps, updateStep } = useAutomationContext();
	const { createNotice } = useDispatch('doublescale/core');
	const [isRenameOpen, setIsRenameOpen] = useState(false);

	const isConfigured = !!step.action;
	const isDisabled = isStepDisabled(step);
	const goalName = getGoalLabel(step);
	const catalogGoalName = getCatalogGoalLabel(step);
	const hasCustomLabel = Boolean(step.settings?.custom_label?.trim());
	const hasWarning = hasGoalWarning(step);
	const warningMessage = getGoalWarningMessage(step);

	const disabledBadge = isDisabled ? (
		<span className="doublescale-reactflow-node__disabled-badge">
			{__('Disabled', 'doublescale')}
		</span>
	) : null;

	const subtitle = isConfigured ? (
		<div className="doublescale-reactflow-node__subtitle-inner flex items-center gap-2">
			{disabledBadge}
			{hasCustomLabel ? (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span
								className="doublescale-reactflow-goal__configured"
								style={{ color: hasWarning ? '#f59e0b' : 'inherit' }}
							>
								{goalName}
							</span>
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-xs">
							<p className="text-xs">
								{__('Default:', 'doublescale')} {catalogGoalName}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			) : (
				<span
					className="doublescale-reactflow-goal__configured"
					style={{ color: hasWarning ? '#f59e0b' : 'inherit' }}
				>
					{goalName}
				</span>
			)}
			{hasWarning && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<AlertTriangleIcon width={20} height={20} color="#F97316" />
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
				children: [],
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

		onClearStep?.();

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

	const handleDeletePrepare = () => {
		onClearStep?.();
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

	const handleToggleEnabled = async () => {
		if (!viewMode) {
			await toggleStepEnabled(
				step,
				isDisabled,
				steps,
				setSteps,
				createNotice
			);
		}
	};

	const handleRenameSave = async (label: string) => {
		await updateStepCustomLabel(
			step,
			label,
			steps,
			setSteps,
			updateStep,
			createNotice
		);
	};

	const isSelected = selectedStepId === step.id.toString();

	return (
		<>
			<NodeContextMenu
				onEdit={viewMode ? undefined : handleEdit}
				onDelete={viewMode ? undefined : handleDelete}
				onDeletePrepare={viewMode ? undefined : handleDeletePrepare}
				disabled={viewMode}
			>
				<SortableNodeContainer
					step={step}
					viewMode={viewMode}
					className={`doublescale-reactflow-node doublescale-reactflow-node--goal doublescale-reactflow-node--card-layout ${isSelected ? 'doublescale-reactflow-node--selected' : ''} ${isDisabled ? 'doublescale-reactflow-node--step-disabled' : ''} ${viewMode && analytics ? 'doublescale-reactflow-node--action-with-analytics' : ''}`}
				>
					<Handle
						type="target"
						position={Position.Top}
						className="doublescale-reactflow-handle doublescale-reactflow-handle--target"
					/>

					<NodeLayout
						variant="goal"
						icon={<GoalsAutomationIcon width={24} height={24} />}
						title={__('Goal', 'doublescale')}
						subtitle={subtitle}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onDeletePrepare={handleDeletePrepare}
						onDuplicate={handleDuplicate}
						onRename={() => {
							onClearStep?.();
							setIsRenameOpen(true);
						}}
						onToggleEnabled={handleToggleEnabled}
						editLabel={__('Edit Goal', 'doublescale')}
						deleteLabel={__('Delete Goal', 'doublescale')}
						duplicateLabel={__('Duplicate Goal', 'doublescale')}
						renameLabel={__('Rename Goal', 'doublescale')}
						toggleEnabledLabel={
							isDisabled
								? __('Enable Goal', 'doublescale')
								: __('Disable Goal', 'doublescale')
						}
						showDuplicate={isConfigured}
						showRename={isConfigured}
						showToggleEnabled={isConfigured}
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
				</SortableNodeContainer>
			</NodeContextMenu>

			<RenameActionDialog
				open={isRenameOpen}
				onOpenChange={setIsRenameOpen}
				currentLabel={step.settings?.custom_label || ''}
				catalogLabel={catalogGoalName}
				onSave={handleRenameSave}
				title={__('Rename Goal', 'doublescale')}
				description={__(
					'Give this goal a custom name to make complex workflows easier to follow.',
					'doublescale'
				)}
			/>
		</>
	);
};

export default GoalNode;
