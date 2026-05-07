/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

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
} from '@doublescale/client';
import NodeContextMenu from '../components/node-context-menu';
import NodeLayout from '../components/node-layout';
import StepReorderControls from '../components/step-reorder-controls';
import { useAutomationContext } from '../../../../state/context';
import { useDispatch } from '@wordpress/data';
import { deleteStep } from '../utils/step-utils';
import { TimerBlockIcon } from '@doublescale/components';
import {
	getAction,
	getActionLabel,
	getActionWarningMessage,
	hasActionWarning,
} from '@doublescale/utils';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface DelayNodeData {
	step: AutomationStep;
	automation: Automation;
	selectedStepId?: string | null;
	viewMode?: boolean;
	analytics?: { contacts: number; conversion_rate: number };
	onStepClick?: (step: OrganizedStep) => void;
	onDeleteStep?: (stepId: string) => void;
}

const DelayNode: React.FC<NodeProps> = (props) => {
	const { data } = props;
	const {
		step,
		onStepClick,
		selectedStepId,
		viewMode = false,
		analytics,
	} = data as unknown as DelayNodeData;

	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('doublescale/core');

	// Check if a delay action has been selected
	const hasActionSelected = !!step.action;
	const actionKey = step.action || 'delay';
	const actionConfig = getAction(actionKey);

	// Get delay label and warning status from backend
	const actionLabel =
		getActionLabel(step) || actionConfig?.label || __('Delay', 'doublescale');
	const hasWarning = hasActionWarning(step);
	const warningMessage = getActionWarningMessage(step);
	const isDelayUntil = actionKey === 'delay-until-datetime';

	const formatDatetime = (value?: string | null) => {
		if (!value) return null;
		const normalized = value.includes('T')
			? value
			: value.replace(' ', 'T');
		const date = new Date(normalized);
		if (Number.isNaN(date.getTime())) {
			return value;
		}
		return date.toLocaleString();
	};

	// Check if configured: must have action selected AND appropriate settings
	const isConfigured =
		hasActionSelected &&
		(isDelayUntil
			? !!step.settings?.datetime
			: !!step.settings?.delay && !!step.settings?.unit);

	const getDelayText = () => {
		if (!isConfigured) return null;
		if (isDelayUntil) {
			return formatDatetime(step.settings?.datetime);
		}
		const delay = step.settings?.delay;
		const unit = step.settings?.unit;
		return delay && unit ? `${delay} ${unit}` : null;
	};

	const delayText = hasWarning ? '...' : getDelayText();

	const subtitle =
		isConfigured && delayText ? (
			<div className="flex items-center gap-2">
				<span
					className="qcrm-reactflow-delay__configured"
					style={{ color: hasWarning ? '#f59e0b' : 'inherit' }}
				>
					{isDelayUntil
						? __('Delays until', 'doublescale')
						: __('Sets to delay', 'doublescale')}{' '}
					{delayText}
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
			<span className="qcrm-reactflow-delay__not-configured">
				<span className="text-[#333333B2] mr-1">
					{__('Need to', 'doublescale')}
				</span>
				{!hasActionSelected
					? __('Select Delay Type', 'doublescale')
					: isDelayUntil
						? __('Set Datetime', 'doublescale')
						: __('Set Delay Time', 'doublescale')}
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
		<NodeContextMenu
			onEdit={viewMode ? undefined : handleEdit}
			onDelete={viewMode ? undefined : handleDelete}
			disabled={viewMode}
		>
			<div
				className={`qcrm-reactflow-node qcrm-reactflow-node--delay ${
					isSelected ? 'qcrm-reactflow-node--selected' : ''
				} ${
					viewMode && analytics
						? 'qcrm-reactflow-node--action-with-analytics'
						: ''
				}`}
				onClick={viewMode ? undefined : handleEdit}
			>
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				{/* Step Reorder Controls - hide in view mode */}
				{!viewMode && <StepReorderControls step={step} />}

				<NodeLayout
					icon={<TimerBlockIcon />}
					title={actionLabel}
					subtitle={subtitle}
					onEdit={handleEdit}
					onDelete={handleDelete}
					editLabel={sprintf(__('Edit %s', 'doublescale'), actionLabel)}
					deleteLabel={sprintf(
						__('Delete %s', 'doublescale'),
						actionLabel
					)}
					deleteTitle={sprintf(
						__('Delete this %s?', 'doublescale'),
						actionLabel
					)}
					deleteDescription={sprintf(
						__(
							'This will remove the %s from your workflow.',
							'doublescale'
						),
						actionLabel
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

export default DelayNode;
