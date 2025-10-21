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
import {
	EdgeProps,
	getBezierPath,
	EdgeLabelRenderer,
	BaseEdge,
	Position,
} from '@xyflow/react';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@quillcrm/client';
import { useAutomationContext } from '../../../../state/context';
import { AddStepDialog } from '../../add-step-dialog';
import './style.scss';

interface AddStepEdgeData {
	sourceStep?: AutomationStep;
	targetStep?: AutomationStep;
	condition?: 'yes' | 'no' | string;
	onStepClick?: (step: any) => void;
}

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

	// Also update any root-level steps that come after this parent condition
	// to maintain proper flow ordering
	if (parentId > 0) {
		const parentStep = steps.find((step) => step.id === parentId);
		if (
			parentStep &&
			'order' in parentStep &&
			typeof parentStep.order === 'number'
		) {
			const rootStepsAfterParent = newSteps.filter(
				(step) => !step.parent_id && step.order > parentStep.order
			);
			rootStepsAfterParent.forEach((step) => {
				if (!updatedSteps[step.id]) {
					updatedSteps[step.id] = { order: step.order + 1 };
					step.order = step.order + 1;
				}
			});
		}
	}

	return { newSteps, updatedSteps, currentStepOrder };
};

const AddStepEdge: React.FC<EdgeProps> = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	data,
	target,
}) => {
	const { sourceStep, targetStep, condition, onStepClick } =
		(data as AddStepEdgeData) || {};
	const [loading, setLoading] = useState(false);
	const [visible, setVisible] = useState(false);
	const { automation, steps, setSteps, setUpdatedSteps } =
		useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	if (!automation) {
		return null;
	}

	// Show add-step button on most edges except:
	// 1. Edges TO add-step nodes (would be redundant)
	// 2. Structural edges without proper step data
	const shouldShowAddStepEdge = Boolean(
		// Don't show on edges going TO add-step nodes
		!(target && target.startsWith('add-step')) &&
		// Must have either a source step or be a condition branch
		(sourceStep || condition)
	);

	if (!shouldShowAddStepEdge) {
		// For other cases where we don't show the plus button
		const edgeStyle = {
			...style,
			stroke: '#D7D7DA', // Unified color for all edges
			strokeWidth: 2,
		};

		return (
			<BaseEdge
				id={id}
				path={
					getBezierPath({
						sourceX,
						sourceY,
						sourcePosition: sourcePosition || Position.Bottom,
						targetX,
						targetY,
						targetPosition: targetPosition || Position.Top,
					})[0]
				}
				style={edgeStyle}
			/>
		);
	}

	const handleStepSelection = async (type: string) => {
		setLoading(true);

		// First, determine parent-child relationships
		let parentId = 0;
		let stepCondition: string | undefined = undefined;

		if (sourceStep && sourceStep.type === 'condition' && condition) {
			// Adding step to a condition branch (direct child of condition)
			parentId = sourceStep.id;
			stepCondition = condition;
		} else if (sourceStep && condition && sourceStep.parent_id) {
			// Adding step within an existing condition branch (sibling of sourceStep)
			parentId = sourceStep.parent_id;
			stepCondition = condition;
		} else if (sourceStep && sourceStep.parent_id) {
			// If sourceStep has a parent, the new step should be a sibling with same parent and condition
			parentId = sourceStep.parent_id;
			stepCondition = sourceStep.condition || undefined;
		} else if (
			targetStep &&
			'parent_id' in targetStep &&
			targetStep.parent_id &&
			'type' in targetStep &&
			targetStep.type !== 'merge'
		) {
			// If targetStep has a parent, the new step should be a sibling with same parent and condition
			parentId = targetStep.parent_id;
			stepCondition = targetStep.condition || undefined;
		} else if (condition) {
			// Edge case: we have a condition but no clear parent context
			// This might happen in some edge scenarios - keep as root level but preserve condition
			stepCondition = condition;
		}

		// Calculate order: if we have targetStep, insert before it, otherwise add at end
		let order: number;

		// Find steps in the same branch to determine proper order
		const sameBranchSteps = steps.filter((step) => {
			if (parentId === 0) {
				return !step.parent_id;
			} else {
				return (
					step.parent_id === parentId &&
					step.condition === stepCondition
				);
			}
		});

		if (
			targetStep &&
			targetStep.type !== 'merge' &&
			'order' in targetStep &&
			typeof targetStep.order === 'number'
		) {
			// Insert before the target step (only if it's a real automation step with order)
			order = targetStep.order;
		} else if (
			sourceStep &&
			'order' in sourceStep &&
			typeof sourceStep.order === 'number'
		) {
			// Insert after the source step
			const stepsAfterSource = sameBranchSteps.filter(
				(step) => step.order > sourceStep.order
			);
			if (stepsAfterSource.length > 0) {
				// Insert before the first step after source
				order = Math.min(...stepsAfterSource.map((s) => s.order));
			} else {
				// No steps after source, add at the end
				order = sourceStep.order + 1;
			}
		} else {
			// Add at the end of the current branch
			if (sameBranchSteps.length === 0) {
				order = 1; // First step in this branch
			} else {
				order = Math.max(...sameBranchSteps.map((s) => s.order)) + 1;
			}
		}

		// Ensure order is always a valid number
		if (typeof order !== 'number' || isNaN(order) || order < 1) {
			console.warn('Invalid order calculated, defaulting to 1:', order);
			order = 1;
		}

		const stepData = {
			automation_id: automation.id,
			type,
			status: 'active',
			order,
		} as Partial<AutomationStep>;

		if (parentId > 0) {
			stepData.parent_id = parentId;
		}
		if (stepCondition) {
			stepData.condition = stepCondition;
		}

		// Set appropriate action based on step type
		if (type === 'condition') {
			stepData.action = 'condition';
		} else if (type === 'end_automation') {
			stepData.action = 'end_automation';
		} else if (type === 'delay') {
			stepData.action = 'delay';
		}
		// For 'action' and 'goal' types, leave action empty - will be set when user selects specific action/goal

		const { newSteps, updatedSteps, currentStepOrder } =
			updateStepOrderRecursive(steps, parentId, order, stepCondition);

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
				message: __('Step added', 'quillcrm'),
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
				}, 100);
			}
		} catch (error: any) {
			console.error('Failed to create step:', error);
			console.error('Request data was:', requestData);

			createNotice({
				type: 'error',
				message: error.message || __('Failed to add step', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	// Determine the correct source and target positions based on edge data
	const getCorrectSourcePosition = (): Position => {
		const edgeData = data as AddStepEdgeData;
		if (
			edgeData &&
			edgeData.sourceStep &&
			edgeData.sourceStep.type === 'condition'
		) {
			// For condition nodes, use the specific handle based on condition
			if (edgeData.condition === 'yes') {
				return Position.Left; // Yes branch from left handle
			} else if (edgeData.condition === 'no') {
				return Position.Right; // No branch from right handle
			}
		}
		// For all other cases, use bottom handle
		return sourcePosition || Position.Bottom;
	};

	const getCorrectTargetPosition = (): Position => {
		// For target nodes, usually top unless specified otherwise
		return targetPosition || Position.Top;
	};

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition: getCorrectSourcePosition(),
		targetX,
		targetY,
		targetPosition: getCorrectTargetPosition(),
	});

	// Use CSS class for edge styling and ensure proper z-index
	const edgeStyle = {
		...style,
		className: 'qcrm-edge',
		zIndex: 1,
	};

	return (
		<>
			<BaseEdge id={id} path={edgePath} style={edgeStyle} />
			<EdgeLabelRenderer>
				<div
					style={{
						transform: `translate(${labelX}px,${labelY}px) translate(-50%, -50%)`,
					}}
					className="qcrm-edge-add-button"
				>
					<AddStepDialog
						visible={visible}
						onVisibleChange={setVisible}
						loading={loading}
						onStepSelection={handleStepSelection}
					/>
				</div>
			</EdgeLabelRenderer>
		</>
	);
};

export default AddStepEdge;
