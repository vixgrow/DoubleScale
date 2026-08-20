/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

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
import RenameActionDialog from '../components/rename-action-dialog';
import { useAutomationContext } from '../../../../state/context';
import { useDispatch } from '@wordpress/data';
import {
	deleteStep,
	duplicateStep,
	isStepDisabled,
	toggleStepEnabled,
} from '../utils/step-utils';
import { updateStepCustomLabel } from '../utils/canvas-notes-utils';
import { AlertTriangleIcon, TimerBlockIcon } from '@doublescale/components';
import {
	getAction,
	getActionLabel,
	getCatalogActionLabel,
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
	onClearStep?: () => void;
	onDeleteStep?: (stepId: string) => void;
}

const DelayNode: React.FC<NodeProps> = (props) => {
	const { data } = props;
	const {
		step,
		onStepClick,
		onClearStep,
		selectedStepId,
		viewMode = false,
		analytics,
	} = data as unknown as DelayNodeData;

	const { steps, setSteps, updateStep } = useAutomationContext();
	const { createNotice } = useDispatch('doublescale/core');
	const [isRenameOpen, setIsRenameOpen] = useState(false);

	const hasActionSelected = !!step.action;
	const actionKey = step.action || 'delay';
	const actionConfig = getAction(actionKey);
	const isDisabled = isStepDisabled(step);

	const actionLabel =
		getActionLabel(step) || actionConfig?.label || __('Delay', 'doublescale');
	const catalogActionLabel =
		getCatalogActionLabel(step) || actionConfig?.label || __('Delay', 'doublescale');
	const hasCustomLabel = Boolean(step.settings?.custom_label?.trim());
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

	const disabledBadge = isDisabled ? (
		<span className="doublescale-reactflow-node__disabled-badge">
			{__('Disabled', 'doublescale')}
		</span>
	) : null;

	const subtitle =
		isConfigured && delayText ? (
			<div className="doublescale-reactflow-node__subtitle-inner flex items-center gap-2">
				{disabledBadge}
				<span
					className="doublescale-reactflow-delay__configured"
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
			<span className="doublescale-reactflow-delay__not-configured">
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

	const titleContent = hasCustomLabel ? (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<span>{actionLabel}</span>
				</TooltipTrigger>
				<TooltipContent side="right" className="max-w-xs">
					<p className="text-xs">
						{__('Default:', 'doublescale')} {catalogActionLabel}
					</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	) : (
		actionLabel
	);

	const handleEdit = () => {
		if (!viewMode && onStepClick) {
			onStepClick({
				...step,
				children: [],
			});
		}
	};

	const handleDelete = async () => {
		if (!viewMode) {
			onClearStep?.();
			await deleteStep(step.id.toString(), steps, setSteps, createNotice);
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
				__('Delay duplicated', 'doublescale')
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
					className={`doublescale-reactflow-node doublescale-reactflow-node--delay doublescale-reactflow-node--card-layout ${
						isSelected ? 'doublescale-reactflow-node--selected' : ''
					} ${isDisabled ? 'doublescale-reactflow-node--step-disabled' : ''} ${
						viewMode && analytics
							? 'doublescale-reactflow-node--action-with-analytics'
							: ''
					}`}
					onClick={viewMode ? undefined : handleEdit}
				>
					<Handle
						type="target"
						position={Position.Top}
						className="doublescale-reactflow-handle doublescale-reactflow-handle--target"
					/>

					<NodeLayout
						variant="delay"
						icon={<TimerBlockIcon width={22} height={22} />}
						title={titleContent}
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
						editLabel={sprintf(__('Edit %s', 'doublescale'), actionLabel)}
						deleteLabel={sprintf(
							__('Delete %s', 'doublescale'),
							actionLabel
						)}
						duplicateLabel={sprintf(
							__('Duplicate %s', 'doublescale'),
							actionLabel
						)}
						renameLabel={sprintf(__('Rename %s', 'doublescale'), actionLabel)}
						toggleEnabledLabel={
							isDisabled
								? sprintf(__('Enable %s', 'doublescale'), actionLabel)
								: sprintf(__('Disable %s', 'doublescale'), actionLabel)
						}
						showDuplicate={isConfigured}
						showRename={isConfigured}
						showToggleEnabled={isConfigured}
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
						className="doublescale-reactflow-handle doublescale-reactflow-handle--source"
					/>
				</SortableNodeContainer>
			</NodeContextMenu>

			<RenameActionDialog
				open={isRenameOpen}
				onOpenChange={setIsRenameOpen}
				currentLabel={step.settings?.custom_label || ''}
				catalogLabel={catalogActionLabel}
				onSave={handleRenameSave}
				title={sprintf(__('Rename %s', 'doublescale'), catalogActionLabel)}
				description={__(
					'Give this delay a custom name to make complex workflows easier to follow.',
					'doublescale'
				)}
			/>
		</>
	);
};

export default DelayNode;
