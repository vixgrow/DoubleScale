/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CheckCircle, XCircle } from 'lucide-react';
/**
 * Internal dependencies
 */
import type { AutomationStep } from '@quillcrm/client';
import { useAutomationContext } from '../../../../state/context';
import { AddStepDialog } from '../../add-step-dialog';

interface MergeNodeData {
	condition: 'yes' | 'no' | 'merge';
	parentId: number;
	conditionStep?: any;
	yesChildCount?: number;
	noChildCount?: number;
	level?: number;
	onMergeClick?: () => void;
	onStepClick?: (step: any) => void;
}

const MergeNode: React.FC<NodeProps> = ({ data }) => {
	const {
		condition,
		conditionStep,
		yesChildCount,
		noChildCount,
		level,
		onMergeClick,
		onStepClick,
	} = data as unknown as MergeNodeData;
	const isYes = condition === 'yes';
	const isMerge = condition === 'merge';
	const mergeLevel = level || 0;

	const [loading, setLoading] = useState(false);
	const [visible, setVisible] = useState(false);
	const { automation, steps, setSteps, setUpdatedSteps, viewMode = false } =
		useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	const handleClick = () => {
		if (onMergeClick) {
			onMergeClick();
		}
	};

	const updateStepOrderRecursive = (
		steps: AutomationStep[],
		parentId: number,
		order: number,
		condition?: string
	) => {
		const updatedSteps = {};
		const newSteps = [...steps];
		let currentStepOrder = order;

		// Find steps that need to be reordered
		const stepsToUpdate = newSteps.filter((step) => {
			if (parentId === 0) {
				return !step.parent_id && step.order >= order;
			} else {
				return (
					step.parent_id === parentId &&
					step.condition === condition &&
					step.order >= order
				);
			}
		});

		// Sort steps by order to ensure proper sequential updating
		stepsToUpdate.sort((a, b) => a.order - b.order);

		// Update their orders - shift all steps forward by 1
		stepsToUpdate.forEach((step) => {
			const newOrder = step.order + 1;
			updatedSteps[step.id] = { order: newOrder };
			step.order = newOrder;
		});

		return { newSteps, updatedSteps, currentStepOrder };
	};

	const handleStepSelection = async (type: string) => {
		if (!automation || viewMode) {
			return;
		}

		setLoading(true);

		// Steps after merge should be positioned immediately after the merge point
		// For root-level merges, add to root level
		// For nested merges, add to the appropriate parent level
		let targetParentId = 0;
		let targetCondition = undefined;
		let targetOrder = 1;

		if (conditionStep && (level || 0) > 0) {
			// For nested merge nodes, determine the correct parent context
			// The new step should be added to the same level as the condition that created this merge
			targetParentId = conditionStep.parent_id || 0;
			targetCondition = conditionStep.condition || undefined;

			// Find all steps at the target parent level that come after the condition step
			const siblingSteps = steps.filter(
				(step) =>
					step.parent_id === targetParentId &&
					step.condition === targetCondition &&
					step.order > conditionStep.order
			);

			// New step should be positioned after the condition and all its branches
			// but before any existing sibling steps that come after
			if (siblingSteps.length > 0) {
				targetOrder = Math.min(...siblingSteps.map((s) => s.order));
			} else {
				// No siblings after condition, find the next available order
				const allSiblingsAtLevel = steps.filter(
					(step) =>
						step.parent_id === targetParentId &&
						step.condition === targetCondition
				);
				targetOrder =
					allSiblingsAtLevel.length > 0
						? Math.max(...allSiblingsAtLevel.map((s) => s.order)) +
						1
						: conditionStep.order + 1;
			}
		} else {
			// Root level merge - find the position after the condition step and its branches
			if (conditionStep) {
				// Find all root-level steps that come after the condition step
				const rootStepsAfterCondition = steps.filter(
					(step) =>
						!step.parent_id && step.order > conditionStep.order
				);

				// New step should be positioned immediately after the condition's branches
				// but before any existing root steps that come after
				if (rootStepsAfterCondition.length > 0) {
					targetOrder = Math.min(
						...rootStepsAfterCondition.map((s) => s.order)
					);
				} else {
					// No root steps after condition, add at the end
					const rootSteps = steps.filter((step) => !step.parent_id);
					targetOrder =
						Math.max(...rootSteps.map((s) => s.order), 0) + 1;
				}
			} else {
				// Fallback: add to end of root level
				const rootSteps = steps.filter((step) => !step.parent_id);
				targetOrder = Math.max(...rootSteps.map((s) => s.order), 0) + 1;
			}
		}

		const stepData = {
			automation_id: automation.id,
			type,
			status: 'active',
			order: targetOrder,
		} as Partial<AutomationStep>;

		// Set parent and condition if this is a nested merge
		if (targetParentId > 0) {
			stepData.parent_id = targetParentId;
		}
		if (targetCondition) {
			stepData.condition = targetCondition;
		}

		// Set appropriate action based on step type
		if (type === 'condition') {
			stepData.action = 'condition';
		} else if (type === 'end_automation') {
			stepData.action = 'end_automation';
		} else if (type === 'delay') {
			stepData.action = 'delay';
		}

		const { newSteps, updatedSteps, currentStepOrder } =
			updateStepOrderRecursive(
				steps,
				targetParentId,
				targetOrder,
				targetCondition
			);

		const requestData = {
			...stepData,
			order: currentStepOrder,
			updated_steps: updatedSteps,
		};

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps`,
				method: 'POST',
				data: requestData,
			})) as AutomationStep;

			setUpdatedSteps({});
			setSteps([...newSteps, response]);

			createNotice({
				type: 'success',
				message: __('Step added after merge', 'quillcrm'),
			});

			// Close dialog first
			setVisible(false);

			// Then open modal/selector for action, condition, goal, and delay steps
			// Use setTimeout to ensure dialog closes before modal opens
			if (
				(type === 'action' ||
					type === 'condition' ||
					type === 'goal' ||
					type === 'delay') &&
				onStepClick
			) {
				setTimeout(() => {
					const organizedStep = {
						...response,
						children: [],
					};
					onStepClick(organizedStep);
				}, 250);
			}
		} catch (error: any) {
			console.error('Error creating step', error);
			createNotice({
				type: 'error',
				message: error.message || __('Failed to add step', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	// Generate a helpful tooltip for merge nodes
	const getMergeTooltip = () => {
		if (!isMerge) return '';

		const yesText =
			yesChildCount && yesChildCount > 0
				? `${yesChildCount} step${yesChildCount > 1 ? 's' : ''} in Yes branch`
				: 'Empty Yes branch';
		const noText =
			noChildCount && noChildCount > 0
				? `${noChildCount} step${noChildCount > 1 ? 's' : ''} in No branch`
				: 'Empty No branch';

		return `Merge point: ${yesText}, ${noText}`;
	};

	return (
		<div
			className={`qcrm-reactflow-node qcrm-reactflow-node--merge qcrm-reactflow-node--merge-${condition}`}
			onClick={!isMerge ? handleClick : undefined} // Only allow clicks for non-merge nodes
			title={isMerge ? getMergeTooltip() : ''}
			data-merge-level={mergeLevel}
		>
			{/* For merge nodes, we have multiple target handles */}
			{isMerge ? (
				<>
					{/* Central top handle for incoming connections */}
					<Handle
						type="target"
						position={Position.Top}
						id="top"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target qcrm-reactflow-handle--merge-input"
						style={{
							top: -6,
							left: '50%',
							transform: 'translateX(-50%)',
						}}
					/>
					{/* Yes and No handles for condition branch connections */}
					<Handle
						type="target"
						position={Position.Left}
						id="yes"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{
							left: -6,
							top: '50%',
							transform: 'translateY(-50%)',
						}}
					/>
					<Handle
						type="target"
						position={Position.Right}
						id="no"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{
							right: -6,
							top: '50%',
							transform: 'translateY(-50%)',
						}}
					/>
					{/* Hidden handles for left/right connections but positioned centrally */}
					<Handle
						type="target"
						position={Position.Left}
						id="left"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{
							left: '50%',
							top: '50%',
							transform: 'translate(-50%, -50%)',
							opacity: 0,
							pointerEvents: 'none',
						}}
					/>
					<Handle
						type="target"
						position={Position.Right}
						id="right"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{
							right: '50%',
							top: '50%',
							transform: 'translate(50%, -50%)',
							opacity: 0,
							pointerEvents: 'none',
						}}
					/>
				</>
			) : (
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>
			)}

			{/* Make merge node function as add-step node */}
			{isMerge ? (
				<div className={viewMode ? 'qcrm-reactflow-merge__dialog--disabled' : ''}>
					<AddStepDialog
						visible={visible}
						onVisibleChange={setVisible}
						loading={loading}
						onStepSelection={handleStepSelection}
						disabled={viewMode}
					/>
				</div>
			) : (
				<div className="qcrm-reactflow-merge__content">
					<div className="qcrm-reactflow-merge__icon">
						{isYes ? <CheckCircle /> : <XCircle />}
					</div>
					<div className="qcrm-reactflow-merge__label">
						{isYes ? __('Yes', 'quillcrm') : __('No', 'quillcrm')}
					</div>
				</div>
			)}

			<Handle
				type="source"
				position={Position.Bottom}
				className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
				style={{ bottom: -6 }}
			/>
		</div>
	);
};

export default MergeNode;
