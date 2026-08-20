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
import type { AutomationStep, OrganizedStep } from '@doublescale/client';
import {
	getConditionCustomLabel,
	hasConditionRules,
} from '@doublescale/utils';
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
import { AlertTriangleIcon, ConditionAutomationIcon } from '@doublescale/components';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { applyFilters } from '@wordpress/hooks';

interface ConditionNodeData {
	step: AutomationStep;
	selectedStepId?: string | null;
	viewMode?: boolean;
	analytics?: { contacts: number; conversion_rate: number };
	onStepClick?: (step: OrganizedStep) => void;
	onClearStep?: () => void;
}

const ConditionNode: React.FC<NodeProps> = (props) => {
	const { data } = props;
	const {
		step,
		onStepClick,
		onClearStep,
		selectedStepId,
		viewMode = false,
		analytics,
	} = data as unknown as ConditionNodeData;

	const { steps, setSteps, updateStep } = useAutomationContext();
	const { createNotice } = useDispatch('doublescale/core');
	const [isRenameOpen, setIsRenameOpen] = useState(false);

	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	const isConfigured = hasConditionRules(step.settings);
	const isDisabled = isStepDisabled(step);
	const customLabel = getConditionCustomLabel(step.settings);
	const hasCustomLabel = Boolean(customLabel);
	const catalogLabel = __('Configured', 'doublescale');

	const hasWarning = step._condition_warning === true;
	const unavailableRulesCount = step._unavailable_rules_count || 0;
	const unavailableRules = step._unavailable_rules || [];

	const uniquePlugins =
		unavailableRules.length > 0
			? [
					...new Set(
						unavailableRules.map((rule: any) => rule.plugin_label)
					),
				].join(', ')
			: '';

	const disabledBadge = isDisabled ? (
		<span className="doublescale-reactflow-node__disabled-badge">
			{__('Disabled', 'doublescale')}
		</span>
	) : null;

	const configuredLabel = !isProActive
		? __('This is a PRO Feature', 'doublescale')
		: hasCustomLabel
			? customLabel
			: catalogLabel;

	const subtitle = isConfigured ? (
		<div className="doublescale-reactflow-node__subtitle-inner flex items-center gap-2">
			{disabledBadge}
			{hasCustomLabel && isProActive ? (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span
								className="doublescale-reactflow-condition__configured"
								style={{
									color: hasWarning ? '#f59e0b' : 'inherit',
								}}
							>
								{configuredLabel}
							</span>
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-xs">
							<p className="text-xs">
								{__('Default:', 'doublescale')} {catalogLabel}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			) : (
				<span
					className="doublescale-reactflow-condition__configured"
					style={{
						color: hasWarning
							? '#f59e0b'
							: !isProActive
								? '#ff4d4f'
								: 'inherit',
					}}
				>
					{configuredLabel}
				</span>
			)}
			{hasWarning && unavailableRulesCount > 0 && (
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
								{unavailableRulesCount === 1
									? sprintf(
											__(
												'This condition uses 1 rule that requires %s to be installed and activated.',
												'doublescale'
											),
											uniquePlugins
										)
									: sprintf(
											__(
												'This condition uses %d rules that require plugins (%s) to be installed and activated.',
												'doublescale'
											),
											unavailableRulesCount,
											uniquePlugins
										)}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	) : (
		<span className="doublescale-reactflow-condition__not-configured">
			{!isProActive
				? __('This is a PRO Feature', 'doublescale')
				: __('Not Configured', 'doublescale')}
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
				__('Condition duplicated', 'doublescale')
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

	const handleRenameOpen = () => {
		onClearStep?.();
		setIsRenameOpen(true);
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
					className={`doublescale-reactflow-node doublescale-reactflow-node--condition doublescale-reactflow-node--card-layout ${isSelected ? 'doublescale-reactflow-node--selected' : ''} ${isDisabled ? 'doublescale-reactflow-node--step-disabled' : ''} ${viewMode && analytics ? 'doublescale-reactflow-node--action-with-analytics' : ''}`}
				>
					<Handle
						type="target"
						position={Position.Top}
						className="doublescale-reactflow-handle doublescale-reactflow-handle--target"
					/>

					<NodeLayout
						variant="condition"
						icon={<ConditionAutomationIcon width={24} height={24} />}
						title={__('Condition', 'doublescale')}
						subtitle={subtitle}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onDeletePrepare={handleDeletePrepare}
						onDuplicate={handleDuplicate}
						onRename={handleRenameOpen}
						onToggleEnabled={handleToggleEnabled}
						editLabel={__('Edit Condition', 'doublescale')}
						deleteLabel={__('Delete Condition', 'doublescale')}
						duplicateLabel={__('Duplicate Condition', 'doublescale')}
						renameLabel={__('Rename Condition', 'doublescale')}
						toggleEnabledLabel={
							isDisabled
								? __('Enable Condition', 'doublescale')
								: __('Disable Condition', 'doublescale')
						}
						showDuplicate={isConfigured}
						showRename={isConfigured}
						showToggleEnabled={isConfigured}
						deleteTitle={__('Delete this condition?', 'doublescale')}
						deleteDescription={__(
							'This will also remove all connected steps in both branches.',
							'doublescale'
						)}
						viewMode={viewMode}
						analytics={analytics}
					/>

					<Handle
						type="source"
						position={Position.Bottom}
						id="yes"
						className="doublescale-reactflow-handle doublescale-reactflow-handle--source doublescale-reactflow-handle--yes"
					/>
					<Handle
						type="source"
						position={Position.Bottom}
						id="no"
						className="doublescale-reactflow-handle doublescale-reactflow-handle--source doublescale-reactflow-handle--no"
					/>
				</SortableNodeContainer>
			</NodeContextMenu>

			<RenameActionDialog
				open={isRenameOpen}
				onOpenChange={setIsRenameOpen}
				currentLabel={customLabel}
				catalogLabel={catalogLabel}
				onSave={handleRenameSave}
				title={__('Rename Condition', 'doublescale')}
				description={__(
					'Give this condition a custom name to make complex workflows easier to follow.',
					'doublescale'
				)}
			/>
		</>
	);
};

export default ConditionNode;
