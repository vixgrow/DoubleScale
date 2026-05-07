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
import type { AutomationStep, OrganizedStep } from '@doublescale/client';
import NodeContextMenu from '../components/node-context-menu';
import NodeLayout from '../components/node-layout';
import StepReorderControls from '../components/step-reorder-controls';
import { useAutomationContext } from '../../../../state/context';
import { useDispatch } from '@wordpress/data';
import { deleteStep } from '../utils/step-utils';
import { ConditionsIcon } from '@doublescale/components';
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
}

const ConditionNode: React.FC<NodeProps> = (props) => {
	const { data } = props;
	const {
		step,
		onStepClick,
		selectedStepId,
		viewMode = false,
		analytics,
	} = data as unknown as ConditionNodeData;

	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('doublescale/core');

	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	// Check if condition is configured - a condition is configured if it has rules
	const isConfigured =
		step.settings &&
		Array.isArray(step.settings) &&
		step.settings.length > 0;

	// Check for warnings in condition settings
	const hasWarning = step._condition_warning === true;
	const unavailableRulesCount = step._unavailable_rules_count || 0;
	const unavailableRules = step._unavailable_rules || [];

	// Get unique plugin labels from unavailable rules
	const uniquePlugins =
		unavailableRules.length > 0
			? [
					...new Set(
						unavailableRules.map((rule: any) => rule.plugin_label)
					),
				].join(', ')
			: '';

	const subtitle = isConfigured ? (
		<div className="flex items-center gap-2">
			<span
				className="qcrm-reactflow-condition__configured"
				style={{
					color: hasWarning
						? '#f59e0b'
						: !isProActive
							? '#ff4d4f'
							: 'inherit',
				}}
			>
				{!isProActive
					? __('This is a PRO Feature', 'doublescale')
					: __('Configured', 'doublescale')}
			</span>
			{hasWarning && unavailableRulesCount > 0 && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<AlertTriangle className="h-4 w-4 text-orange-500" />
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
		<span className="qcrm-reactflow-condition__not-configured">
			{!isProActive
				? __('This is a PRO Feature', 'doublescale')
				: __('Not Configured', 'doublescale')}
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
				className={`qcrm-reactflow-node qcrm-reactflow-node--condition ${isSelected ? 'qcrm-reactflow-node--selected' : ''} ${viewMode && analytics ? 'qcrm-reactflow-node--action-with-analytics' : ''}`}
			>
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				{/* Step Reorder Controls - hide in view mode */}
				{!viewMode && <StepReorderControls step={step} />}

				<NodeLayout
					icon={<ConditionsIcon width={23} height={23} />}
					title={__('Condition', 'doublescale')}
					subtitle={subtitle}
					onEdit={handleEdit}
					onDelete={handleDelete}
					editLabel={__('Edit Condition', 'doublescale')}
					deleteLabel={__('Delete Condition', 'doublescale')}
					deleteTitle={__('Delete this condition?', 'doublescale')}
					deleteDescription={__(
						'This will also remove all connected steps in both branches.',
						'doublescale'
					)}
					viewMode={viewMode}
					analytics={analytics}
				/>

				{/* Separate source handles for yes and no branches */}
				<Handle
					type="source"
					position={Position.Bottom}
					id="yes"
					className="qcrm-reactflow-handle qcrm-reactflow-handle--source qcrm-reactflow-handle--yes"
				/>
				<Handle
					type="source"
					position={Position.Bottom}
					id="no"
					className="qcrm-reactflow-handle qcrm-reactflow-handle--source qcrm-reactflow-handle--no"
				/>
			</div>
		</NodeContextMenu>
	);
};

export default ConditionNode;
