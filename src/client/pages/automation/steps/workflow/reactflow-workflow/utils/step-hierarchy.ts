/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Node, Edge } from '@xyflow/react';

import {
	findStepAnalytics,
	toNodeAnalytics,
} from './analytics-utils';

/**
 * Internal dependencies
 */
import type {
	AutomationStep,
	OrganizedStep,
	Automation,
} from '@doublescale/client';
import { createMergeNodeData } from './merge-utils';
import { calculateBranchWidth } from './helper';
import { LAYOUT_CONSTANTS_VIEW_MODE } from '../config';

const processStepHierarchy = (
	stepList: AutomationStep[],
	initialNodes: Node[],
	initialEdges: Edge[],
	automation: Automation,
	onStepClick: ((stepData: OrganizedStep) => void) | undefined,
	onClearStep: (() => void) | undefined,
	onDeleteStep: (stepId: string) => Promise<void>,
	getNodePositionLocal: (
		nodeId: string,
		fallbackX?: number,
		fallbackY?: number,
		step?: AutomationStep,
		stepIndex?: number
	) => { x: number; y: number },
	startX: number,
	startY: number,
	nodeWidth: number,
	nodeYesNoWidth: number,
	addStepWidth: number,
	savedPositions: Record<string, { x: number; y: number }>,
	parentId: number | null = null,
	condition: string | null = null,
	level: number = 0,
	startIndex: number = 0,
	selectedStepId?: string | null,
	viewMode: boolean = false,
	analyticsData: any[] = []
): { lastIndex: number; lastStepId?: string } => {
	// Get steps for current level
	const currentLevelSteps = stepList
		.filter(
			(step) =>
				(parentId === null &&
					(!step.parent_id || step.parent_id === 0)) ||
				(parentId !== null &&
					step.parent_id === parentId &&
					step.condition === condition)
		)
		.sort((a, b) => a.order - b.order);

	let currentIndex = startIndex;
	const conditionStepsToProcess: Array<{
		step: AutomationStep;
		level: number;
		yesChildren: AutomationStep[];
		noChildren: AutomationStep[];
	}> = [];

	currentLevelSteps.forEach((step, stepIndex) => {
		const position = getNodePositionLocal(
			step.id.toString(),
			startX,
			startY,
			step,
			stepIndex
		);

		// Get step analytics
		const stepAnalytics = findStepAnalytics(analyticsData, step.id);

		// Add step node
		initialNodes.push({
			id: step.id.toString(),
			type: step.type,
			position,
			data: {
				step,
				automation,
				selectedStepId,
				viewMode,
				analytics: toNodeAnalytics(stepAnalytics),
				onStepClick: (stepData: OrganizedStep) => {
					if (onStepClick) {
						onStepClick(stepData);
					}
				},
				onClearStep,
				onDeleteStep, // Pass the delete function to nodes
			},
		});

		// Connect to parent
		if (currentIndex === 0 && level === 0) {
			// Connect first root step to trigger
			initialEdges.push({
				id: `trigger-to-${step.id}`,
				source: 'trigger',
				target: step.id.toString(),
				type: 'addStepEdge',
				data: {
					sourceStep: { id: 'trigger', type: 'trigger' }, // trigger
					targetStep: step,
					onStepClick,
				},
			});
		} else if (stepIndex === 0 && level > 0 && parentId) {
			// For first child in condition branch, don't connect directly to parent
			// Connection will be handled through merge nodes
			// Skip creating direct edge from condition to first child
		} else if (stepIndex > 0) {
			// Connect to previous sibling - but skip if previous step is a condition
			const prevStep = currentLevelSteps[stepIndex - 1];

			// Skip creating sequential connections from condition nodes
			// since they only have yes/no branches
			if (prevStep.type !== 'condition') {
				const sourceHandle = undefined;

				initialEdges.push({
					id: `${prevStep.id}-to-${step.id}`,
					source: prevStep.id.toString(),
					target: step.id.toString(),
					sourceHandle,
					type: 'addStepEdge',
					data: {
						sourceStep: prevStep,
						targetStep: step,
						onStepClick,
					},
				});
			}
		}

		// Handle condition step children recursively
		if (step.type === 'condition') {
			// Debug: Log the condition step and all available steps

			// First, process all children and get their info
			const yesChildren = stepList
				.filter((s) => s.parent_id === step.id && s.condition === 'yes')
				.sort((a, b) => a.order - b.order);
			const noChildren = stepList
				.filter((s) => s.parent_id === step.id && s.condition === 'no')
				.sort((a, b) => a.order - b.order);

			// Store condition step info for immediate processing
			conditionStepsToProcess.push({
				step,
				level,
				yesChildren,
				noChildren,
			});

			// Update current index to continue after condition structure
			currentIndex++;
		} else {
			currentIndex++;
		}
	});

	// Now process all condition steps after all children are positioned
	conditionStepsToProcess.forEach(
		({ step, level, yesChildren, noChildren }) => {
			const conditionPos = getNodePositionLocal(step.id.toString());

			const yesWidth = calculateBranchWidth(
				stepList,
				step.id,
				'yes',
				level + 1
			);
			const noWidth = calculateBranchWidth(
				stepList,
				step.id,
				'no',
				level + 1
			);

			let center = conditionPos.x + nodeWidth / 2 - nodeYesNoWidth / 2;
			const maxWidth = Math.max(yesWidth, noWidth);
			const fallbackYesX = center - maxWidth / 2;
			const fallbackNoX = center + maxWidth / 2;

			// Always create Yes/No branch nodes for semantic branching
			const yesNodeId = `branch-yes-${step.id}`;
			const noNodeId = `branch-no-${step.id}`;

			// Calculate spacing based on view mode
			const branchSpacing = viewMode
				? LAYOUT_CONSTANTS_VIEW_MODE.CONDITION_TO_BRANCH_SPACING
				: 150;

			// Align Yes/No badges to the X-center of their first child so the
			// connector becomes a single continuous trunk + vertical drop.
			// Falls back to the legacy symmetric layout when a branch is empty.
			const yesBranchCenterX = (() => {
				const firstYesChild = yesChildren[0];
				if (firstYesChild) {
					const childPos = getNodePositionLocal(
						firstYesChild.id.toString()
					);
					return childPos.x + nodeWidth / 2;
				}
				return fallbackYesX + nodeYesNoWidth / 2;
			})();
			const noBranchCenterX = (() => {
				const firstNoChild = noChildren[0];
				if (firstNoChild) {
					const childPos = getNodePositionLocal(
						firstNoChild.id.toString()
					);
					return childPos.x + nodeWidth / 2;
				}
				return fallbackNoX + nodeYesNoWidth / 2;
			})();

			const yesX = yesBranchCenterX - nodeYesNoWidth / 2;
			const noX = noBranchCenterX - nodeYesNoWidth / 2;

			const yesPosition = savedPositions[yesNodeId] || {
				x: yesX,
				y: conditionPos.y + branchSpacing,
			};
			const noPosition = savedPositions[noNodeId] || {
				x: noX,
				y: conditionPos.y + branchSpacing,
			};

			// Yes/No branch badge nodes are no longer rendered; the colored
			// conditionEdge now flows directly from the Condition node into the
			// first child (or empty-branch add-step). yesPosition/noPosition are
			// still used below as anchors for the empty-branch add-step layout.

			// Create single merge node positioned below both branches
			const mergeId = `merge-${step.id}-level-${level}`;

			// Create enhanced merge node data with level information
			const mergeNodeData = {
				...createMergeNodeData(step, yesChildren, noChildren),
				level, // Pass the current nesting level for visual distinction
				onStepClick,
			};

			// Calculate merge position based on actual children positions
			// Find the bottommost Y position among all children in both branches
			let maxChildY = Math.max(yesPosition.y, noPosition.y) + 120; // Start with branch positions

			// Recursively calculate the bottom-most Y position including nested conditions
			const calculateMaxYInBranch = (
				branchSteps: AutomationStep[]
			): number => {
				let maxY = 0;
				branchSteps.forEach((child) => {
					const childPos = getNodePositionLocal(child.id.toString());
					maxY = Math.max(maxY, childPos.y + 100);

					// If this child is a condition, also check its merge node position
					if (child.type === 'condition') {
						// Calculate where this child's merge would be positioned
						const childYesChildren = stepList.filter(
							(s) =>
								s.parent_id === child.id &&
								s.condition === 'yes'
						);
						const childNoChildren = stepList.filter(
							(s) =>
								s.parent_id === child.id && s.condition === 'no'
						);

						// Recursively calculate the max Y for this child's branches
						const childYesMaxY =
							calculateMaxYInBranch(childYesChildren);
						const childNoMaxY =
							calculateMaxYInBranch(childNoChildren);
						const childMaxBranchY = Math.max(
							childYesMaxY,
							childNoMaxY
						);

						// Add spacing for the child's merge node
						const childMergeY = Math.max(
							childPos.y + 250, // Reduced spacing
							childMaxBranchY + 100 // Reduced spacing
						);
						maxY = Math.max(maxY, childMergeY);
					}
				});
				return maxY;
			};

			// Check yes children positions (including nested conditions)
			const yesMaxY = calculateMaxYInBranch(yesChildren);
			maxChildY = Math.max(maxChildY, yesMaxY);

			// Check no children positions (including nested conditions)
			const noMaxY = calculateMaxYInBranch(noChildren);
			maxChildY = Math.max(maxChildY, noMaxY);

			center = conditionPos.x + nodeWidth / 2 - addStepWidth / 2;

			// Calculate merge position with reduced spacing for nested conditions
			const baseSpacing = 120; // Reduced base spacing
			const nestingMultiplier = level * 10; // Reduced multiplier per level
			const hasNestedConditionsInBranch = [
				...yesChildren,
				...noChildren,
			].some((child) => child.type === 'condition');
			const nestedSpacing = hasNestedConditionsInBranch ? 150 : 0; // Reduced nested spacing

			const mergeY =
				maxChildY + baseSpacing + nestingMultiplier + nestedSpacing;

			const optimalMergePosition = {
				x: center,
				y: mergeY,
			};

			const mergePosition =
				savedPositions[mergeId] || optimalMergePosition;

			// Create merge node FIRST before processing children
			initialNodes.push({
				id: mergeId,
				type: 'merge',
				position: mergePosition,
				data: mergeNodeData,
			});

			// NOW: Process the children to create their nodes and edges AFTER merge node exists
			processStepHierarchy(
				stepList,
				initialNodes,
				initialEdges,
				automation,
				onStepClick,
				onClearStep,
				onDeleteStep,
				getNodePositionLocal,
				startX,
				startY,
				nodeWidth,
				nodeYesNoWidth,
				addStepWidth,
				savedPositions,
				step.id,
				'yes',
				level + 1,
				0,
				selectedStepId,
				viewMode,
				analyticsData
			);

			processStepHierarchy(
				stepList,
				initialNodes,
				initialEdges,
				automation,
				onStepClick,
				onClearStep,
				onDeleteStep,
				getNodePositionLocal,
				startX,
				startY,
				nodeWidth,
				nodeYesNoWidth,
				addStepWidth,
				savedPositions,
				step.id,
				'no',
				level + 1,
				0,
				selectedStepId,
				viewMode,
				analyticsData
			);

			const trunkCenterX = conditionPos.x + nodeWidth / 2;

			// === Yes branch: condition → first child (or empty-branch + button) ===
			let yesTargetId: string;
			if (yesChildren.length === 0) {
				const yesAddStepId = `add-step-yes-${step.id}`;
				const yesAddStepPosition = savedPositions[yesAddStepId] || {
					x: yesPosition.x + nodeYesNoWidth / 2 - addStepWidth / 2,
					y: yesPosition.y + branchSpacing,
				};

				initialNodes.push({
					id: yesAddStepId,
					type: 'add_step',
					position: yesAddStepPosition,
					data: {
						parentId: step.id,
						condition: 'yes',
						prevStep: null,
						onStepClick,
					},
				});

				initialEdges.push({
					id: `${yesAddStepId}-to-merge`,
					source: yesAddStepId,
					target: mergeId,
					targetHandle: 'yes',
					type: 'straightEdge',
					style: {
						stroke: '#D7D7DA',
						strokeWidth: 2,
					},
					data: {
						condition: 'yes',
						sourceStep: undefined,
						targetStep: { id: mergeId, type: 'merge' },
					},
				});

				yesTargetId = yesAddStepId;
			} else {
				yesTargetId = yesChildren[0].id.toString();
			}

			initialEdges.push({
				id: `${step.id}-to-yes-branch`,
				source: step.id.toString(),
				sourceHandle: 'yes',
				target: yesTargetId,
				type: 'conditionEdge',
				label: __('Yes', 'doublescale'),
				style: {
					strokeWidth: 2,
				},
				data: {
					condition: 'yes',
					trunkCenterX,
					sourceStep: step,
					targetStep:
						yesChildren[0] ?? { id: yesTargetId, type: 'add_step' },
				},
				className:
					'doublescale-condition-edge doublescale-condition-edge--yes',
				markerEnd: 'doublescale-condition-arrow-yes',
			});

			if (yesChildren.length > 0) {

				// Connect last yes child to merge
				const lastYesChild = yesChildren[yesChildren.length - 1];

				if (lastYesChild.type === 'condition') {
					// For child conditions, we don't connect them directly here
					// The connection will be handled by the post-processing function
					// This prevents duplicate edges to the same merge node
				} else {
					// For regular steps, always connect to the parent merge
					// Child condition merges will be handled separately in post-processing
					// Validate that both source and target nodes exist
					const sourceExists = initialNodes.some(
						(node) => node.id === lastYesChild.id.toString()
					);
					const targetExists = initialNodes.some(
						(node) => node.id === mergeId
					);

					if (sourceExists && targetExists) {
						initialEdges.push({
							id: `${lastYesChild.id}-to-merge`,
							source: lastYesChild.id.toString(),
							target: mergeId,
							targetHandle: 'yes',
							type: 'addStepEdge',
							style: {
								stroke: '#D7D7DA',
								strokeWidth: 2,
							},
							data: {
								sourceStep: lastYesChild,
								targetStep: {
									id: mergeId,
									type: 'merge',
								},
								onStepClick,
								fromBranch: 'yes',
							},
						});
					} else {
					}
				}
			}

			// === No branch: condition → first child (or empty-branch + button) ===
			let noTargetId: string;
			if (noChildren.length === 0) {
				const noAddStepId = `add-step-no-${step.id}`;
				const noAddStepPosition = savedPositions[noAddStepId] || {
					x: noPosition.x + nodeYesNoWidth / 2 - addStepWidth / 2,
					y: noPosition.y + branchSpacing,
				};

				initialNodes.push({
					id: noAddStepId,
					type: 'add_step',
					position: noAddStepPosition,
					data: {
						parentId: step.id,
						condition: 'no',
						prevStep: null,
						onStepClick,
					},
				});

				initialEdges.push({
					id: `${noAddStepId}-to-merge`,
					source: noAddStepId,
					target: mergeId,
					targetHandle: 'no',
					type: 'straightEdge',
					style: {
						stroke: '#D7D7DA',
						strokeWidth: 2,
					},
					data: {
						condition: 'no',
						sourceStep: undefined,
						targetStep: { id: mergeId, type: 'merge' },
					},
				});

				noTargetId = noAddStepId;
			} else {
				noTargetId = noChildren[0].id.toString();
			}

			initialEdges.push({
				id: `${step.id}-to-no-branch`,
				source: step.id.toString(),
				sourceHandle: 'no',
				target: noTargetId,
				type: 'conditionEdge',
				label: __('No', 'doublescale'),
				style: {
					strokeWidth: 2,
				},
				data: {
					condition: 'no',
					trunkCenterX,
					sourceStep: step,
					targetStep:
						noChildren[0] ?? { id: noTargetId, type: 'add_step' },
				},
				className:
					'doublescale-condition-edge doublescale-condition-edge--no',
				markerEnd: 'doublescale-condition-arrow-no',
			});

			if (noChildren.length > 0) {

				// Connect last no child to merge
				const lastNoChild = noChildren[noChildren.length - 1];

				if (lastNoChild.type === 'condition') {
					// For child conditions, we don't connect them directly here
					// The connection will be handled by the post-processing function
					// This prevents duplicate edges to the same merge node
				} else {
					// For regular steps, connect to the parent merge
					// But check if there are any child conditions after this step
					const childConditionsAfter = noChildren.filter(
						(child, index) =>
							index > noChildren.indexOf(lastNoChild) &&
							child.type === 'condition'
					);

					if (childConditionsAfter.length > 0) {
					} else {
						// Safe to connect regular step to merge

						// Validate that both source and target nodes exist
						const sourceExists = initialNodes.some(
							(node) => node.id === lastNoChild.id.toString()
						);
						const targetExists = initialNodes.some(
							(node) => node.id === mergeId
						);

						if (sourceExists && targetExists) {
							initialEdges.push({
								id: `${lastNoChild.id}-to-merge`,
								source: lastNoChild.id.toString(),
								target: mergeId,
								targetHandle: 'no',
								type: 'addStepEdge',
								style: {
									stroke: '#D7D7DA',
									strokeWidth: 2,
								},
								data: {
									sourceStep: lastNoChild,
									targetStep: {
										id: mergeId,
										type: 'merge',
									},
									onStepClick,
									fromBranch: 'no',
								},
							});
						} else {
						}
					}
				}
			}
		}
	);

	return {
		lastIndex: currentIndex,
		lastStepId:
			currentLevelSteps.length > 0
				? currentLevelSteps[currentLevelSteps.length - 1].id.toString()
				: undefined,
	};
};

export { processStepHierarchy };
