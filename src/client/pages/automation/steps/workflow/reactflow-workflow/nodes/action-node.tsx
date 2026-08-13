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
} from '@doublescale/client';
import NodeContextMenu from '../components/node-context-menu';
import NodeLayout from '../components/node-layout';
import SortableNodeContainer from '../components/sortable-node-container';
import AnalyticsPopup from '../components/analytics-popup';
import { useAutomationContext } from '../../../../state/context';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
	deleteStep,
	duplicateStep,
	isStepDisabled,
	toggleStepEnabled,
} from '../utils/step-utils';
import { updateStepCustomLabel } from '../utils/canvas-notes-utils';
import { getActionLabel, getCatalogActionLabel, hasActionWarning } from '@doublescale/utils';
import { AlertTriangleIcon, ActionIcon, ActionsIcon, ViewIcon } from '@doublescale/components';
import { useStepAnalytics } from '../hooks/use-step-analytics';
import { supportsAnalytics, getChannelType } from '../constants/action-types';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import RenameActionDialog from '../components/rename-action-dialog';

interface ActionNodeData {
	step: AutomationStep;
	automation: Automation;
	selectedStepId?: string | null;
	viewMode?: boolean;
	analytics?: { contacts: number; conversion_rate: number };
	onStepClick?: (step: OrganizedStep) => void;
	onDeleteStep?: (stepId: string) => void;
}

const ActionNode: React.FC<NodeProps> = (props) => {
	const { data } = props;
	const {
		step,
		onStepClick,
		selectedStepId,
		viewMode = false,
		analytics,
	} = data as unknown as ActionNodeData;

	const { steps, setSteps, updateStep } = useAutomationContext();
	const { createNotice } = useDispatch('doublescale/core');
	const [isRenameOpen, setIsRenameOpen] = useState(false);

	// Use custom analytics hook
	const {
		analyticsData,
		isVisible: isAnalyticsVisible,
		fetchAnalytics,
		showAnalytics: openAnalyticsPopup,
		hideAnalytics,
	} = useStepAnalytics();

	// Check if action is configured - an action is configured if it has an action slug
	const isConfigured = !!step.action;

	// A disabled action stays on the canvas but is skipped when the automation runs.
	const isDisabled = isStepDisabled(step);

	// Get action label and warning status from backend
	const actionName = getActionLabel(step);
	const catalogActionName = getCatalogActionLabel(step);
	const hasCustomLabel = Boolean(step.settings?.custom_label?.trim());
	const hasWarning = hasActionWarning(step);

	// Check if this action supports analytics
	const hasAnalytics = supportsAnalytics(step.action || '');

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
								className="doublescale-reactflow-action__configured"
								style={{ color: hasWarning ? '#f59e0b' : 'inherit' }}
							>
								{actionName}
							</span>
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-xs">
							<p className="text-xs">
								{__('Default:', 'doublescale')} {catalogActionName}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			) : (
				<span
					className="doublescale-reactflow-action__configured"
					style={{ color: hasWarning ? '#f59e0b' : 'inherit' }}
				>
					{actionName}
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
							<p className="text-xs mt-1">
								{__(
									'This action requires a plugin that is not currently active. Please activate the required plugin for this automation to work.',
									'doublescale'
								)}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	) : (
		<span className="doublescale-reactflow-action__not-configured">
			{__('Not Configured', 'doublescale')}
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

	const handleDuplicate = async () => {
		if (!viewMode) {
			await duplicateStep(
				step,
				steps,
				setSteps,
				createNotice,
				__('Action duplicated', 'doublescale')
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

	// Check if this node is selected
	const isSelected = selectedStepId === step.id.toString();

	const openAnalytics = async () => {
		openAnalyticsPopup();
		await fetchAnalytics(Number(step.id));
	};

	// Custom footer for analytics
	const customFooter =
		viewMode && hasAnalytics && isConfigured ? (
			<div className="flex justify-center items-center pb-3">
				<button
					className="doublescale-reactflow-node__analytics-link doublescale-reactflow-node__analytics-link--interactive text-primary nodrag nopan"
					onClickCapture={(e) => {
						e.stopPropagation();
						e.preventDefault();
					}}
					onPointerDown={(e) => {
						e.stopPropagation();
						e.preventDefault();
					}}
					onPointerUp={async (e) => {
						e.stopPropagation();
						e.preventDefault();
						await openAnalytics();
					}}
					onMouseDown={(e) => e.stopPropagation()}
					onMouseUp={(e) => e.stopPropagation()}
					title={__('View Analytics', 'doublescale')}
					type="button"
				>
					<ViewIcon width={16} height={16} />
					<span>{__('View Analytics', 'doublescale')}</span>
				</button>
			</div>
		) : undefined;

	return (
		<>
			<NodeContextMenu
				onEdit={viewMode ? undefined : handleEdit}
				onDelete={viewMode ? undefined : handleDelete}
				disabled={viewMode}
			>
				<SortableNodeContainer
					step={step}
					viewMode={viewMode}
					className={`doublescale-reactflow-node doublescale-reactflow-node--action doublescale-reactflow-node--card-layout ${isSelected ? 'doublescale-reactflow-node--selected' : ''} ${isDisabled ? 'doublescale-reactflow-node--step-disabled' : ''} ${viewMode && ((hasAnalytics && isConfigured) || analytics) ? 'doublescale-reactflow-node--action-with-analytics' : ''}`}
				>
					<Handle
						type="target"
						position={Position.Top}
						className="doublescale-reactflow-handle doublescale-reactflow-handle--target"
					/>

					<NodeLayout
						variant="action"
						icon={<ActionsIcon width={24} height={24} />}
						title={__('Action', 'doublescale')}
						subtitle={subtitle}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onDuplicate={handleDuplicate}
						onRename={() => setIsRenameOpen(true)}
						onToggleEnabled={handleToggleEnabled}
						editLabel={__('Edit Action', 'doublescale')}
						deleteLabel={__('Delete Action', 'doublescale')}
						duplicateLabel={__('Duplicate Action', 'doublescale')}
						renameLabel={__('Rename Action', 'doublescale')}
						toggleEnabledLabel={
							isDisabled
								? __('Enable Action', 'doublescale')
								: __('Disable Action', 'doublescale')
						}
						showDuplicate={isConfigured}
						showRename={isConfigured}
						showToggleEnabled={isConfigured}
						deleteTitle={__('Delete this action?', 'doublescale')}
						deleteDescription={__(
							'This will remove the action from your workflow.',
							'doublescale'
						)}
						viewMode={viewMode}
						analytics={analytics}
						customFooter={customFooter}
					/>

					<Handle
						type="source"
						position={Position.Bottom}
						className="doublescale-reactflow-handle doublescale-reactflow-handle--source"
					/>
				</SortableNodeContainer>
			</NodeContextMenu>

			{/* Analytics Popup */}
			{isConfigured && hasAnalytics && isAnalyticsVisible && !hasWarning && (
				<AnalyticsPopup
					visible={isAnalyticsVisible}
					onClose={hideAnalytics}
					actionType={getChannelType(step.action || '')}
					analytics={
						analyticsData || {
							sent: analytics?.contacts || 0,
							clickRate: analytics?.conversion_rate || 0,
						}
					}
				/>
			)}

			<RenameActionDialog
				open={isRenameOpen}
				onOpenChange={setIsRenameOpen}
				currentLabel={step.settings?.custom_label || ''}
				catalogLabel={catalogActionName}
				onSave={handleRenameSave}
			/>
		</>
	);
};

export default ActionNode;
