/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Internal dependencies
 */
import type {
	AutomationStep,
	Automation,
	OrganizedStep,
} from '@quillcrm/client';
import NodeContextMenu from '../components/node-context-menu';
import NodeLayout from '../components/node-layout';
import StepReorderControls from '../components/step-reorder-controls';
import AnalyticsPopup from '../components/analytics-popup';
import { useAutomationContext } from '../../../../state/context';
import { useDispatch } from '@wordpress/data';
import { deleteStep } from '../utils/step-utils';
import { getActionLabel, hasActionWarning } from '@quillcrm/utils';
import { ActionIcon, ViewIcon } from '@quillcrm/components';
import { useStepAnalytics } from '../hooks/use-step-analytics';
import { supportsAnalytics, getChannelType } from '../constants/action-types';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

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

	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	// Use custom analytics hook
	const {
		analyticsData,
		isVisible: showAnalytics,
		fetchAnalytics,
		hideAnalytics,
	} = useStepAnalytics();

	// Check if action is configured - an action is configured if it has an action slug
	const isConfigured = !!step.action;

	// Get action label and warning status from backend
	const actionName = getActionLabel(step);
	const hasWarning = hasActionWarning(step);

	// Check if this action supports analytics
	const hasAnalytics = supportsAnalytics(step.action || '');

	// Get recipient info for display
	const getRecipientInfo = () => {
		if (!isConfigured || !hasAnalytics) return null;

		// This would come from step configuration in real implementation
		// For now, showing placeholder
		return __('To: (100 contacts)', 'quillcrm');
	};

	const subtitle = isConfigured ? (
		<div className="flex items-center gap-2">
			<span
				className="qcrm-reactflow-action__configured"
				style={{ color: hasWarning ? '#f59e0b' : 'inherit' }}
			>
				{actionName}
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
									'This action requires a plugin that is not currently active. Please activate the required plugin for this automation to work.',
									'quillcrm'
								)}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	) : (
		<span className="qcrm-reactflow-action__not-configured">
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

	const handleViewAnalytics = async (e: React.MouseEvent) => {
		e.stopPropagation();
		await fetchAnalytics(step.id);
	};

	// Custom footer for analytics
	const customFooter =
		!viewMode && hasAnalytics && isConfigured ? (
			<div className="qcrm-reactflow-node__footer-row">
				<div className="qcrm-reactflow-node__recipient text-[#660FF1]">
					{getRecipientInfo()}
				</div>
				<button
					className="qcrm-reactflow-node__analytics-link text-primary"
					onClick={handleViewAnalytics}
					title={__('View Analytics', 'quillcrm')}
				>
					<ViewIcon width={16} height={16} />
					<span>{__('View Analytics', 'quillcrm')}</span>
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
				<div
					className={`qcrm-reactflow-node qcrm-reactflow-node--action ${isSelected ? 'qcrm-reactflow-node--selected' : ''} ${(hasAnalytics && isConfigured) || (viewMode && analytics) ? 'qcrm-reactflow-node--action-with-analytics' : ''}`}
				>
					<Handle
						type="target"
						position={Position.Top}
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
					/>

					{/* Step Reorder Controls - hide in view mode */}
					{!viewMode && <StepReorderControls step={step} />}

					<NodeLayout
						icon={<ActionIcon width={23} height={23} />}
						title={__('Action', 'quillcrm')}
						subtitle={subtitle}
						onEdit={handleEdit}
						onDelete={handleDelete}
						editLabel={__('Edit Action', 'quillcrm')}
						deleteLabel={__('Delete Action', 'quillcrm')}
						deleteTitle={__('Delete this action?', 'quillcrm')}
						deleteDescription={__(
							'This will remove the action from your workflow.',
							'quillcrm'
						)}
						viewMode={viewMode}
						analytics={analytics}
						customFooter={customFooter}
					/>

					<Handle
						type="source"
						position={Position.Bottom}
						className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
					/>
				</div>
			</NodeContextMenu>

			{/* Analytics Popup */}
			{isConfigured && hasAnalytics && analyticsData && !hasWarning && (
				<AnalyticsPopup
					visible={showAnalytics}
					onClose={hideAnalytics}
					actionType={getChannelType(step.action || '')}
					analytics={analyticsData}
				/>
			)}
		</>
	);
};

export default ActionNode;
