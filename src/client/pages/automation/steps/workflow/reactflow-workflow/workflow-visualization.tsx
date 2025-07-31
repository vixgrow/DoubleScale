/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	calculateMergePosition,
	createMergeNodeData,
} from './utils/merge-utils';

/**
 * External dependencies
 */
import {
	ReactFlow,
	Node,
	Edge,
	useNodesState,
	useEdgesState,
	NodeMouseHandler,
	Background,
	Controls,
	MiniMap,
	EdgeTypes,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	Automation,
	AutomationStep,
	OrganizedStep,
} from '@quillcrm/client';
import { useAutomationContext } from '../../../state/context';
import TriggerNode from './nodes/trigger-node';
import ActionNode from './nodes/action-node';
import ConditionNode from './nodes/condition-node';
import GoalNode from './nodes/goal-node';
import EndNode from './nodes/end-node';
import AddStepNode from './nodes/add-step-node';
import MergeNode from './nodes/merge-node';
import BranchNode from './nodes/branch-node';
import AddStepEdge from './edges/add-step-edge';
import ConditionEdge from './edges/condition-edge';
import { use } from '@wordpress/data';

// Register custom node types
const nodeTypes = {
	trigger: TriggerNode,
	action: ActionNode,
	condition: ConditionNode,
	goal: GoalNode,
	end_automation: EndNode,
	add_step: AddStepNode,
	merge: MergeNode,
	branch: BranchNode,
};

// Register custom edge types
const edgeTypes: EdgeTypes = {
	addStepEdge: AddStepEdge,
	conditionEdge: ConditionEdge,
};

interface WorkflowVisualizationProps {
	automation?: Automation;
	steps?: AutomationStep[];
	isLoading?: boolean;
	onStepClick?: (step: OrganizedStep) => void;
	onTriggerClick?: () => void;
}

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
	automation,
	steps = [],
	isLoading = false,
	onStepClick,
	onTriggerClick,
}) => {
	const { updateAutomation } = useAutomationContext();

	// Set up ReactFlow state - initialize with computed values
	const [nodesState, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edgesState, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	// Delete a step from the automation
	const onDeleteStep = useCallback(
		async (stepId: string) => {
			if (!automation || !steps) return;

			try {
				// Find the step to delete
				const stepToDelete = steps.find(
					(s) => s.id.toString() === stepId
				);
				if (!stepToDelete) {
					console.error('Step not found:', stepId);
					return;
				}

				// Calculate updated orders for remaining steps similar to other nodes
				const updatedOrdersSteps: Record<string, { order: number }> =
					{};

				if (stepToDelete.parent_id) {
					// For child steps, reorder siblings
					steps
						.filter(
							(s) =>
								s.parent_id === stepToDelete.parent_id &&
								s.condition === stepToDelete.condition
						)
						.filter((s) => s.id !== stepToDelete.id)
						.sort((a, b) => a.order - b.order)
						.forEach((child, index) => {
							const newOrder = index + 1;
							if (newOrder !== child.order) {
								updatedOrdersSteps[child.id] = {
									order: newOrder,
								};
							}
						});
				} else {
					// For root steps, reorder all root steps
					steps
						.filter((s) => !s.parent_id || s.parent_id === 0)
						.filter((s) => s.id !== stepToDelete.id)
						.sort((a, b) => a.order - b.order)
						.forEach((step, index) => {
							const newOrder = index + 1;
							if (newOrder !== step.order) {
								updatedOrdersSteps[step.id] = {
									order: newOrder,
								};
							}
						});
				}

				// Make API call to delete the step using the correct endpoint
				await apiFetch({
					path: `/qc/v1/automation-steps/${stepId}`,
					method: 'DELETE',
					data: {
						updated_steps: updatedOrdersSteps,
					},
				});

				// Refresh the automation data after deletion
				const updatedAutomation = (await apiFetch({
					path: `/qc/v1/automations/${automation.id}`,
					method: 'GET',
				})) as Automation;

				// Update context with the refreshed automation
				updateAutomation(updatedAutomation);
			} catch (error) {
				console.error('Failed to delete step:', error);
				// You might want to show a user-friendly error message here
			}
		},
		[automation, steps, updateAutomation]
	);

	// Clear saved positions to force re-layout
	const clearSavedPositions = useCallback(async () => {
		if (!automation) return;

		try {
			const updatedAutomation = {
				...automation,
				settings: {
					...automation.settings,
					reactflow_positions: {}, // Clear all positions
				},
			};

			// Update automation settings
			await apiFetch({
				path: `/qc/v1/automations/${automation.id}`,
				method: 'POST',
				data: updatedAutomation,
			});

			// Update context immediately
			updateAutomation(updatedAutomation);
		} catch (error) {
			console.error('Failed to clear saved positions:', error);
		}
	}, [automation, updateAutomation]);

	useEffect(() => {
		console.log(nodesState);
	}, [nodesState]);

	useEffect(() => {
		console.log(edgesState);
	}, [edgesState]);

	useEffect(() => {
		const initialNodes: Node[] = [];
		const initialEdges: Edge[] = [];
		// the width of node
		const nodeWidth = 280;
		// the width of the add step node
		const addStepWidth = 30;
		// the width of the yes and no nodes
		const nodeYesNoWidth = 80;
		// start X position of the nodes
		const startX = 250;
		// start Trigger node Y position
		const startY = 50;
		// The distance between nodes
		const incrementY = 250;

		// Get saved positions from automation settings
		const savedPositions = automation?.settings?.reactflow_positions || {};

		// Always add trigger node at the top
		const triggerPosition = savedPositions['trigger'] || {
			x: startX,
			y: startY,
		};
		initialNodes.push({
			id: 'trigger',
			type: 'trigger',
			position: triggerPosition,
			data: { automation, onTriggerClick },
		});

		if (!steps || steps.length === 0) {
			const addStepPosition = savedPositions['add-step-initial'] || {
				x: triggerPosition.x + nodeWidth / 2 - addStepWidth / 2,
				y: triggerPosition.y + incrementY,
			};

			initialNodes.push({
				id: 'add-step-initial',
				type: 'add_step',
				position: addStepPosition,
				data: {
					parentId: null,
					condition: null,
					prevStep: null,
				},
			});

			initialEdges.push({
				id: 'trigger-to-add',
				source: 'trigger',
				target: 'add-step-initial',
				type: 'addStepEdge',
				data: {
					sourceStep: undefined,
					targetStep: undefined,
				},
			});

			setNodes(initialNodes);
			setEdges(initialEdges);
			return;
		}

		// Enhanced positioning system for nested conditions
		// This algorithm calculates proper spacing and positioning for complex nested condition structures
		// by recursively calculating the width requirements of each branch and positioning nodes
		// to prevent overlaps and provide clean, readable layouts
		const calculateBranchWidth = (
			stepList: AutomationStep[],
			parentId: number | null,
			condition: string | null,
			level: number = 0
		): number => {
			// Get all steps that belong to this branch
			const branchSteps = stepList
				.filter((step) => {
					if (parentId === null) {
						return !step.parent_id || step.parent_id === 0;
					}
					return (
						step.parent_id === parentId &&
						step.condition === condition
					);
				})
				.sort((a, b) => a.order - b.order);

			// Calculate minimum width based on level and content - reduced for tighter layout
			const baseWidth = 200; // Reasonable base width
			const levelMultiplier = 1 + level * 0.2; // Reduced multiplier for level spacing
			const minWidth = baseWidth * levelMultiplier;

			if (branchSteps.length === 0) {
				return minWidth; // Minimum width for empty branch
			}

			let maxWidth = minWidth;

			branchSteps.forEach((step) => {
				if (step.type === 'condition') {
					// Calculate width needed for both yes and no branches
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

					// Reduced spacing calculation for tighter layout
					const branchSpacing = Math.max(100, 60 + level * 20); // Reduced spacing
					const conditionWidth = yesWidth + noWidth + branchSpacing;

					// Ensure minimum width for readability
					const adjustedWidth = Math.max(conditionWidth, minWidth);
					maxWidth = Math.max(maxWidth, adjustedWidth);
				}
			});

			// Reduced padding for tighter layout
			const complexityPadding = level > 0 ? 50 + level * 30 : 40;
			const finalWidth = maxWidth + complexityPadding;

			return finalWidth;
		};

		// Position calculator that considers nested structure
		const positionMap = new Map<string, { x: number; y: number }>();

		const calculatePositions = (
			stepList: AutomationStep[],
			parentId: number | null = null,
			condition: string | null = null,
			level: number = 0,
			startX: number,
			startY: number
		): number => {
			// Return the final Y position
			const branchSteps = stepList
				.filter((step) => {
					if (parentId === null) {
						return !step.parent_id || step.parent_id === 0;
					}
					return (
						step.parent_id === parentId &&
						step.condition === condition
					);
				})
				.sort((a, b) => a.order - b.order);

			let currentY = startY;

			branchSteps.forEach((step, stepIndex) => {
				const stepId = step.id.toString();

				if (step.type === 'condition') {
					// For condition nodes, calculate positions for children first
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

					// For condition nodes, use currentY to ensure proper spacing after previous condition branches
					// This prevents overlapping when multiple condition nodes are in the same branch
					const conditionY = currentY + incrementY;

					// Position condition node at center
					positionMap.set(stepId, { x: startX, y: conditionY });

					// Calculate child positions with reduced spacing for tighter layout
					const baseSpacing = 200; // Reduced base spacing
					const levelMultiplier = 1 + level * 0.3; // Reduced multiplier
					const childY = conditionY + baseSpacing * levelMultiplier;

					// Reduced branch spacing calculation
					const branchGap = Math.max(150, 80 + level * 30); // Reduced gap
					const totalChildWidth = yesWidth + noWidth + branchGap;

					// Position yes branch to the left and get its end Y position
					const yesX = startX - totalChildWidth / 2 + yesWidth / 2;
					const yesEndY = calculatePositions(
						stepList,
						step.id,
						'yes',
						level + 1,
						yesX,
						childY
					);

					// Position no branch to the right and get its end Y position
					const noX = startX + totalChildWidth / 2 - noWidth / 2;
					const noEndY = calculatePositions(
						stepList,
						step.id,
						'no',
						level + 1,
						noX,
						childY
					);

					// Use the actual end positions from the child branches
					const maxBranchEndY = Math.max(yesEndY, noEndY);

					// Reduced merge spacing calculation with much tighter spacing
					// Also check for any nested conditions in children to ensure proper spacing
					const hasNestedConditions = stepList.some(
						(s) => s.parent_id === step.id && s.type === 'condition'
					);

					const baseBottomSpacing = hasNestedConditions ? 300 : 250; // Much reduced spacing
					const mergeSpacing = Math.max(150, 100 + level * 25); // Reduced dynamic spacing
					const levelSpacing = level * 50; // Much reduced spacing per level
					const nestedConditionSpacing = hasNestedConditions
						? 100
						: 0; // Reduced additional space

					currentY = Math.max(
						conditionY +
							baseBottomSpacing +
							levelSpacing +
							nestedConditionSpacing,
						maxBranchEndY +
							mergeSpacing +
							levelSpacing +
							nestedConditionSpacing
					);
				} else {
					// For non-condition nodes, position normally with increased spacing
					currentY += incrementY; // Increased spacing between regular steps for better clarity
					positionMap.set(stepId, { x: startX, y: currentY });
				}
			});

			return currentY; // Return the final Y position
		};

		// Helper function to get saved position or calculated position
		const getNodePosition = (
			nodeId: string,
			fallbackX = startX,
			fallbackY = startY
		) => {
			// If we have a saved position, use it
			if (savedPositions[nodeId]) {
				return savedPositions[nodeId];
			}

			// Check if we have a calculated position
			if (positionMap.has(nodeId)) {
				return positionMap.get(nodeId)!;
			}
			return { x: fallbackX, y: fallbackY };
		};

		// Calculate all positions first
		calculatePositions(steps, null, null, 0, startX, startY);

		// Helper function to recursively process steps and their children
		const processStepHierarchy = (
			stepList: AutomationStep[],
			parentId: number | null = null,
			condition: string | null = null,
			level: number = 0,
			startIndex: number = 0
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
				const position = getNodePosition(
					step.id.toString(),
					startX,
					startY
				);

				// Add step node
				initialNodes.push({
					id: step.id.toString(),
					type: step.type,
					position,
					data: {
						step,
						automation,
						onStepClick: (stepData: OrganizedStep) => {
							if (onStepClick) {
								onStepClick(stepData);
							}
						},
						clearSavedPositions, // Pass the clear function to nodes
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
							},
						});
					}
				}

				// Handle condition step children recursively
				if (step.type === 'condition') {
					// Debug: Log the condition step and all available steps

					// First, process all children and get their info
					const yesChildren = stepList
						.filter(
							(s) =>
								s.parent_id === step.id && s.condition === 'yes'
						)
						.sort((a, b) => a.order - b.order);
					const noChildren = stepList
						.filter(
							(s) =>
								s.parent_id === step.id && s.condition === 'no'
						)
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
					const conditionPos = getNodePosition(step.id.toString());

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

					let center =
						conditionPos.x + nodeWidth / 2 - nodeYesNoWidth / 2;
					const maxWidth = Math.max(yesWidth, noWidth);
					const yesX = center - maxWidth / 2;
					const noX = center + maxWidth / 2;

					// Always create Yes/No branch nodes for semantic branching
					const yesNodeId = `branch-yes-${step.id}`;
					const noNodeId = `branch-no-${step.id}`;

					// Use the already calculated branch positions for proper alignment
					const yesPosition = savedPositions[yesNodeId] || {
						x: yesX,
						y: conditionPos.y + 150,
					};
					const noPosition = savedPositions[noNodeId] || {
						x: noX,
						y: conditionPos.y + 150,
					};

					// Create Yes branch node
					initialNodes.push({
						id: yesNodeId,
						type: 'branch',
						position: yesPosition,
						data: {
							condition: 'yes',
							conditionStep: step,
						},
					});

					// Create No branch node
					initialNodes.push({
						id: noNodeId,
						type: 'branch',
						position: noPosition,
						data: {
							condition: 'no',
							conditionStep: step,
						},
					});

					// Create single merge node positioned below both branches
					const mergeId = `merge-${step.id}-level-${level}`;

					// Create enhanced merge node data with level information
					const mergeNodeData = {
						...createMergeNodeData(step, yesChildren, noChildren),
						level, // Pass the current nesting level for visual distinction
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
							const childPos = getNodePosition(
								child.id.toString()
							);
							maxY = Math.max(maxY, childPos.y + 100);

							// If this child is a condition, also check its merge node position
							if (child.type === 'condition') {
								const childMergeId = `merge-${child.id}-level-${level + 1}`;
								// Calculate where this child's merge would be positioned
								const childYesChildren = stepList.filter(
									(s) =>
										s.parent_id === child.id &&
										s.condition === 'yes'
								);
								const childNoChildren = stepList.filter(
									(s) =>
										s.parent_id === child.id &&
										s.condition === 'no'
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
						maxChildY +
						baseSpacing +
						nestingMultiplier +
						nestedSpacing;

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
						step.id,
						'yes',
						level + 1,
						0
					);

					processStepHierarchy(stepList, step.id, 'no', level + 1, 0);

					// Connect condition to Yes branch node with explicit handle
					initialEdges.push({
						id: `${step.id}-to-yes-branch`,
						source: step.id.toString(),
						sourceHandle: 'yes',
						target: yesNodeId,
						type: 'conditionEdge',
						label: __('Yes', 'quillcrm'),
						style: {
							stroke: '#D7D7DA',
							strokeWidth: 3,
						},
						data: {
							condition: 'yes',
							sourceStep: step,
							targetStep: { id: yesNodeId, type: 'branch' },
						},
						className:
							'qcrm-condition-edge qcrm-condition-edge--yes',
					});

					// Connect condition to No branch node with explicit handle
					initialEdges.push({
						id: `${step.id}-to-no-branch`,
						source: step.id.toString(),
						sourceHandle: 'no',
						target: noNodeId,
						type: 'conditionEdge',
						label: __('No', 'quillcrm'),
						style: {
							stroke: '#D7D7DA',
							strokeWidth: 3,
						},
						data: {
							condition: 'no',
							sourceStep: step,
							targetStep: { id: noNodeId, type: 'branch' },
						},
						className:
							'qcrm-condition-edge qcrm-condition-edge--no',
					});

					// Connect Yes branch node to its children or merge
					if (yesChildren.length === 0) {
						// Create add-step node for empty yes branch
						const yesAddStepId = `add-step-yes-${step.id}`;
						const yesAddStepPosition = savedPositions[
							yesAddStepId
						] || {
							x:
								yesPosition.x +
								nodeYesNoWidth / 2 -
								addStepWidth / 2,
							y: yesPosition.y + 150,
						};

						initialNodes.push({
							id: yesAddStepId,
							type: 'add_step',
							position: yesAddStepPosition,
							data: {
								parentId: step.id,
								condition: 'yes',
								prevStep: null,
							},
						});

						// Connect Yes branch node to add-step node
						initialEdges.push({
							id: `${yesNodeId}-to-add-step`,
							source: yesNodeId,
							target: yesAddStepId,
							type: 'addStepEdge',
							style: {
								stroke: '#D7D7DA',
								strokeWidth: 2,
							},
							data: {
								condition: 'yes',
								sourceStep: {
									id: yesNodeId,
									type: 'branch',
								},
								targetStep: undefined,
							},
						});

						// Connect add-step node to merge
						initialEdges.push({
							id: `${yesAddStepId}-to-merge`,
							source: yesAddStepId,
							target: mergeId,
							targetHandle: 'yes',
							type: 'default',
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
					} else {
						// Connect Yes branch node to first yes child
						const firstYesChild = yesChildren[0];
						initialEdges.push({
							id: `${yesNodeId}-to-${firstYesChild.id}`,
							source: yesNodeId,
							target: firstYesChild.id.toString(),
							type: 'addStepEdge',
							style: {
								stroke: '#D7D7DA',
								strokeWidth: 2,
							},
							data: {
								condition: 'yes',
								sourceStep: {
									id: yesNodeId,
									type: 'branch',
								},
								targetStep: firstYesChild,
							},
						});

						// Connect last yes child to merge
						const lastYesChild =
							yesChildren[yesChildren.length - 1];

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
										fromBranch: 'yes',
									},
								});
							} else {
							}
						}
					}

					// Connect No branch node to its children or merge
					if (noChildren.length === 0) {
						// Create add-step node for empty no branch
						const noAddStepId = `add-step-no-${step.id}`;
						const noAddStepPosition = savedPositions[
							noAddStepId
						] || {
							x:
								noPosition.x +
								nodeYesNoWidth / 2 -
								addStepWidth / 2,
							y: noPosition.y + 150,
						};

						initialNodes.push({
							id: noAddStepId,
							type: 'add_step',
							position: noAddStepPosition,
							data: {
								parentId: step.id,
								condition: 'no',
								prevStep: null,
							},
						});

						// Connect No branch node to add-step node
						initialEdges.push({
							id: `${noNodeId}-to-add-step`,
							source: noNodeId,
							target: noAddStepId,
							type: 'addStepEdge',
							style: {
								stroke: '#D7D7DA',
								strokeWidth: 2,
							},
							data: {
								condition: 'no',
								sourceStep: {
									id: noNodeId,
									type: 'branch',
								},
								targetStep: undefined,
							},
						});

						// Connect add-step node to merge
						initialEdges.push({
							id: `${noAddStepId}-to-merge`,
							source: noAddStepId,
							target: mergeId,
							targetHandle: 'no',
							type: 'default',
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
					} else {
						// Connect No branch node to first no child
						const firstNoChild = noChildren[0];
						initialEdges.push({
							id: `${noNodeId}-to-${firstNoChild.id}`,
							source: noNodeId,
							target: firstNoChild.id.toString(),
							type: 'addStepEdge',
							style: {
								stroke: '#D7D7DA',
								strokeWidth: 2,
							},
							data: {
								condition: 'no',
								sourceStep: {
									id: noNodeId,
									type: 'branch',
								},
								targetStep: firstNoChild,
							},
						});

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
									(node) =>
										node.id === lastNoChild.id.toString()
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
						? currentLevelSteps[
								currentLevelSteps.length - 1
							].id.toString()
						: undefined,
			};
		};

		// Process the entire step hierarchy starting from root
		const result = processStepHierarchy(steps, null, null, 0, 0);

		// Post-process to ensure all child condition merge nodes connect to their parent merge nodes
		function connectChildMergesToParentMerges() {
			const conditionSteps = steps.filter(
				(step) => step.type === 'condition'
			);

			conditionSteps.forEach((conditionStep) => {
				// Find the level of this condition step
				let level = 0;
				let currentStep = conditionStep;
				while (currentStep.parent_id) {
					const parent = steps.find(
						(s) => s.id === currentStep.parent_id
					);
					if (parent && parent.type === 'condition') {
						level++;
						currentStep = parent;
					} else {
						break;
					}
				}

				// Only process child conditions (level > 0)
				if (level > 0 && conditionStep.parent_id) {
					const parentCondition = steps.find(
						(s) => s.id === conditionStep.parent_id
					);
					if (
						parentCondition &&
						parentCondition.type === 'condition'
					) {
						const childMergeId = `merge-${conditionStep.id}-level-${level}`;
						const parentLevel = level - 1;
						const parentMergeId = `merge-${parentCondition.id}-level-${parentLevel}`;

						// Check if this child merge node exists and parent merge node exists
						const childMergeExists = initialNodes.some(
							(node) => node.id === childMergeId
						);
						const parentMergeExists = initialNodes.some(
							(node) => node.id === parentMergeId
						);

						// Check if edge already exists
						const edgeId = `${childMergeId}-to-parent-merge`;
						const edgeExists = initialEdges.some(
							(edge) => edge.id === edgeId
						);

						// Check if there are steps after this child condition that should be connected first
						// Find steps in the same branch after this condition
						const stepsAfterChildCondition = steps
							.filter(
								(s) =>
									s.parent_id === conditionStep.parent_id &&
									s.condition === conditionStep.condition &&
									s.order > conditionStep.order
							)
							.sort((a, b) => a.order - b.order);

						// Connect child merge to parent merge for proper flow
						if (
							childMergeExists &&
							parentMergeExists &&
							!edgeExists
						) {
							// If there are steps after this child condition, don't connect directly to parent
							// The subsequent steps should handle the connection chain
							if (stepsAfterChildCondition.length > 0) {
							} else {
								// No subsequent steps, safe to connect directly to parent merge
								// Determine which handle on the parent merge to connect to
								// This should match the condition branch this child belongs to
								const targetHandle = conditionStep.condition;

								initialEdges.push({
									id: edgeId,
									source: childMergeId,
									target: parentMergeId,
									targetHandle: targetHandle,
									type: 'default',
									style: {
										stroke: '#D7D7DA',
										strokeWidth: 2,
									},
									data: {
										sourceStep: {
											id: childMergeId,
											type: 'merge',
										},
										targetStep: {
											id: parentMergeId,
											type: 'merge',
										},
										fromBranch: conditionStep.condition,
										fromChildMerge: true,
									},
								});
							}
						} else if (edgeExists) {
						} else {
						}
					}
				}
			});
		}

		connectChildMergesToParentMerges();

		// Connect child merge nodes to subsequent steps in the same branch
		function connectChildMergesToSubsequentSteps() {
			const conditionSteps = steps.filter(
				(step) => step.type === 'condition'
			);

			conditionSteps.forEach((conditionStep) => {
				// Find the level of this condition step
				let level = 0;
				let currentStep = conditionStep;
				while (currentStep.parent_id) {
					const parent = steps.find(
						(s) => s.id === currentStep.parent_id
					);
					if (parent && parent.type === 'condition') {
						level++;
						currentStep = parent;
					} else {
						break;
					}
				}

				// Only process child conditions (level > 0)
				if (level > 0 && conditionStep.parent_id) {
					const childMergeId = `merge-${conditionStep.id}-level-${level}`;

					// Find steps after this child condition in the same branch
					const stepsAfterChildCondition = steps
						.filter(
							(s) =>
								s.parent_id === conditionStep.parent_id &&
								s.condition === conditionStep.condition &&
								s.order > conditionStep.order
						)
						.sort((a, b) => a.order - b.order);

					if (stepsAfterChildCondition.length > 0) {
						const nextStep = stepsAfterChildCondition[0];
						const edgeId = `${childMergeId}-to-${nextStep.id}`;

						// Check if this merge node exists and edge doesn't already exist
						const mergeExists = initialNodes.some(
							(node) => node.id === childMergeId
						);
						const edgeExists = initialEdges.some(
							(edge) => edge.id === edgeId
						);

						if (mergeExists && !edgeExists) {
							initialEdges.push({
								id: edgeId,
								source: childMergeId,
								target: nextStep.id.toString(),
								type: 'default',
								style: {
									stroke: '#D7D7DA',
									strokeWidth: 2,
								},
								data: {
									sourceStep: {
										id: childMergeId,
										type: 'merge',
									},
									targetStep: nextStep,
									fromChildMerge: true,
								},
							});
						}
					}
				}
			});
		}

		connectChildMergesToSubsequentSteps();

		// Connect the last step in each branch to the parent merge node
		function connectLastStepsToParentMerge() {
			const conditionSteps = steps.filter(
				(step) => step.type === 'condition'
			);

			conditionSteps.forEach((conditionStep) => {
				// Only process parent conditions that have child conditions
				const hasChildConditions = steps.some(
					(s) =>
						s.parent_id === conditionStep.id &&
						s.type === 'condition'
				);

				if (hasChildConditions) {
					// Find the level of this condition step
					let level = 0;
					let currentStep = conditionStep;
					while (currentStep.parent_id) {
						const parent = steps.find(
							(s) => s.id === currentStep.parent_id
						);
						if (parent && parent.type === 'condition') {
							level++;
							currentStep = parent;
						} else {
							break;
						}
					}

					const parentMergeId = `merge-${conditionStep.id}-level-${level}`;

					// Process each branch (yes/no)
					['yes', 'no'].forEach((branchCondition) => {
						// Get all steps in this branch
						const branchSteps = steps
							.filter(
								(s) =>
									s.parent_id === conditionStep.id &&
									s.condition === branchCondition
							)
							.sort((a, b) => a.order - b.order);

						if (branchSteps.length > 0) {
							// Find the last non-condition step in this branch
							const lastNonConditionStep = branchSteps
								.filter((s) => s.type !== 'condition')
								.sort((a, b) => b.order - a.order)[0]; // Get highest order non-condition step

							if (lastNonConditionStep) {
								// Check if there are any child conditions after this step
								const childConditionsAfter = branchSteps.filter(
									(s) =>
										s.type === 'condition' &&
										s.order > lastNonConditionStep.order
								);

								// If this is truly the last step (no child conditions after it)
								// OR if there are child conditions but they have subsequent steps
								if (childConditionsAfter.length === 0) {
									// This step should connect to parent merge
									const edgeId = `${lastNonConditionStep.id}-to-parent-merge`;
									const edgeExists = initialEdges.some(
										(edge) => edge.id === edgeId
									);

									if (!edgeExists) {
										initialEdges.push({
											id: edgeId,
											source: lastNonConditionStep.id.toString(),
											target: parentMergeId,
											targetHandle: branchCondition,
											type: 'addStepEdge',
											style: {
												stroke: '#D7D7DA',
												strokeWidth: 2,
											},
											data: {
												sourceStep:
													lastNonConditionStep,
												targetStep: {
													id: parentMergeId,
													type: 'merge',
												},
												fromBranch: branchCondition,
											},
										});
									}
								} else {
									// There are child conditions after this step
									// Check if those child conditions have subsequent steps
									let hasSubsequentStepsAfterChildConditions =
										false;

									childConditionsAfter.forEach(
										(childCondition) => {
											const stepsAfterChild =
												branchSteps.filter(
													(s) =>
														s.order >
														childCondition.order
												);
											if (stepsAfterChild.length > 0) {
												hasSubsequentStepsAfterChildConditions =
													true;
											}
										}
									);

									if (
										hasSubsequentStepsAfterChildConditions
									) {
										// Find the truly last step in the branch
										const trulyLastStep =
											branchSteps[branchSteps.length - 1];
										const edgeId = `${trulyLastStep.id}-to-parent-merge`;
										const edgeExists = initialEdges.some(
											(edge) => edge.id === edgeId
										);

										if (
											!edgeExists &&
											trulyLastStep.type !== 'condition'
										) {
											initialEdges.push({
												id: edgeId,
												source: trulyLastStep.id.toString(),
												target: parentMergeId,
												targetHandle: branchCondition,
												type: 'addStepEdge',
												style: {
													stroke: '#D7D7DA',
													strokeWidth: 2,
												},
												data: {
													sourceStep: trulyLastStep,
													targetStep: {
														id: parentMergeId,
														type: 'merge',
													},
													fromBranch: branchCondition,
												},
											});
										}
									}
								}
							}
						}
					});
				}
			});
		}

		connectLastStepsToParentMerge();

		// Helper function to find the last merge node in a branch that should connect to the parent merge
		function findLastMergeInBranch(
			parentConditionId: number,
			condition: string,
			level: number
		): string | null {
			// Get all steps in this branch
			const branchSteps = steps
				.filter(
					(s) =>
						s.parent_id === parentConditionId &&
						s.condition === condition
				)
				.sort((a, b) => a.order - b.order);

			if (branchSteps.length === 0) return null;

			// Find the last condition in this branch
			const lastCondition = branchSteps
				.filter((s) => s.type === 'condition')
				.sort((a, b) => b.order - a.order)[0]; // Get the condition with highest order

			if (lastCondition) {
				// Calculate the level for this last condition
				let conditionLevel = level + 1;
				const lastConditionMergeId = `merge-${lastCondition.id}-level-${conditionLevel}`;

				return lastConditionMergeId;
			}

			return null;
		}

		// Connect merge nodes to subsequent steps after all merge hierarchies are established
		function connectMergesToSubsequentSteps() {
			const conditionSteps = steps.filter(
				(step) => step.type === 'condition'
			);

			conditionSteps.forEach((conditionStep) => {
				// Find the level of this condition step
				let level = 0;
				let currentStep = conditionStep;
				while (currentStep.parent_id) {
					const parent = steps.find(
						(s) => s.id === currentStep.parent_id
					);
					if (parent && parent.type === 'condition') {
						level++;
						currentStep = parent;
					} else {
						break;
					}
				}

				const mergeId = `merge-${conditionStep.id}-level-${level}`;

				// Find subsequent steps at the same level
				const subsequentSteps = steps
					.filter((s) => {
						if (level === 0) {
							return (
								!s.parent_id && s.order > conditionStep.order
							);
						} else {
							return (
								s.parent_id === conditionStep.parent_id &&
								s.condition === conditionStep.condition &&
								s.order > conditionStep.order
							);
						}
					})
					.sort((a, b) => a.order - b.order);

				if (subsequentSteps.length > 0) {
					const nextStep = subsequentSteps[0];

					// Check if this merge node exists
					const mergeExists = initialNodes.some(
						(node) => node.id === mergeId
					);

					if (mergeExists) {
						// For root level conditions, check if there are child conditions that should connect first
						if (level === 0) {
							// Check if there are child conditions in either branch that should connect first
							const yesLastMerge = findLastMergeInBranch(
								conditionStep.id,
								'yes',
								level
							);
							const noLastMerge = findLastMergeInBranch(
								conditionStep.id,
								'no',
								level
							);

							// If there are child merges, they will handle the connection to this merge
							// and this merge should not directly connect to subsequent steps
							if (yesLastMerge || noLastMerge) {
							} else {
								// No child merges, safe to connect directly
								const edgeId = `${mergeId}-to-${nextStep.id}`;
								const edgeExists = initialEdges.some(
									(edge) => edge.id === edgeId
								);

								if (!edgeExists) {
									initialEdges.push({
										id: edgeId,
										source: mergeId,
										target: nextStep.id.toString(),
										type: 'default',
										style: {
											stroke: '#D7D7DA',
											strokeWidth: 2,
										},
										data: {
											sourceStep: {
												id: mergeId,
												type: 'merge',
											},
											targetStep: nextStep,
											fromMerge: true,
										},
									});
								}
							}
						} else {
							// For child conditions, the connection will flow through parent merge
						}
					}
				}
			});
		}

		connectMergesToSubsequentSteps();

		// Final pass: Connect the appropriate merge nodes to subsequent root-level steps
		function connectFinalMergeToSubsequentSteps() {
			// Find root-level conditions that have subsequent steps
			const rootConditions = steps
				.filter(
					(s) =>
						s.type === 'condition' &&
						(!s.parent_id || s.parent_id === 0)
				)
				.sort((a, b) => a.order - b.order);

			rootConditions.forEach((rootCondition) => {
				// Find subsequent root-level steps
				const subsequentSteps = steps
					.filter(
						(s) =>
							(!s.parent_id || s.parent_id === 0) &&
							s.order > rootCondition.order
					)
					.sort((a, b) => a.order - b.order);

				if (subsequentSteps.length > 0) {
					const nextStep = subsequentSteps[0];
					const rootMergeId = `merge-${rootCondition.id}-level-0`;

					// Find the deepest merge nodes in each branch that should connect to the root merge
					const yesLastMerge = findLastMergeInBranch(
						rootCondition.id,
						'yes',
						0
					);
					const noLastMerge = findLastMergeInBranch(
						rootCondition.id,
						'no',
						0
					);

					// If there are no child merges, the root merge should connect to the next step
					if (!yesLastMerge && !noLastMerge) {
						const edgeId = `${rootMergeId}-to-${nextStep.id}`;
						const edgeExists = initialEdges.some(
							(edge) => edge.id === edgeId
						);

						if (!edgeExists) {
							initialEdges.push({
								id: edgeId,
								source: rootMergeId,
								target: nextStep.id.toString(),
								type: 'default',
								style: {
									stroke: '#D7D7DA',
									strokeWidth: 2,
								},
								data: {
									sourceStep: {
										id: rootMergeId,
										type: 'merge',
									},
									targetStep: nextStep,
									fromMerge: true,
								},
							});
						}
					} else {
						// There are child merges, so the flow goes:
						// child merges → root merge → subsequent step
						// The child-to-root connections are already handled
						// Now ensure root merge connects to subsequent step
						const edgeId = `${rootMergeId}-to-${nextStep.id}`;
						const edgeExists = initialEdges.some(
							(edge) => edge.id === edgeId
						);

						if (!edgeExists) {
							initialEdges.push({
								id: edgeId,
								source: rootMergeId,
								target: nextStep.id.toString(),
								type: 'default',
								style: {
									stroke: '#D7D7DA',
									strokeWidth: 2,
								},
								data: {
									sourceStep: {
										id: rootMergeId,
										type: 'merge',
									},
									targetStep: nextStep,
									fromMerge: true,
								},
							});
						}
					}
				}
			});
		}

		connectFinalMergeToSubsequentSteps();

		// Additional edge validation to remove any potential duplicates
		function removeDuplicateEdges() {
			const edgeMap = new Map<string, number>();
			const uniqueEdges: typeof initialEdges = [];

			initialEdges.forEach((edge, index) => {
				const key = `${edge.source}-${edge.target}-${edge.targetHandle || 'default'}`;

				if (edgeMap.has(key)) {
					console.warn('Removing duplicate edge:', {
						edgeId: edge.id,
						key,
						duplicateOf: edgeMap.get(key),
					});
				} else {
					edgeMap.set(key, index);
					uniqueEdges.push(edge);
				}
			});

			// Replace with unique edges
			initialEdges.length = 0;
			initialEdges.push(...uniqueEdges);
		}

		removeDuplicateEdges();

		function addFinalAddStep() {
			// Add final add-step node for root level if needed
			const rootSteps = steps
				.filter((step) => !step.parent_id || step.parent_id === 0)
				.sort((a, b) => a.order - b.order);

			// Only add final add-step node if the last root step is not a condition or end_automation
			const lastRootStep =
				rootSteps.length > 0 ? rootSteps[rootSteps.length - 1] : null;
			const shouldAddFinalStep =
				rootSteps.length === 0 ||
				(lastRootStep &&
					lastRootStep.type !== 'end_automation' &&
					lastRootStep.type !== 'condition');

			if (shouldAddFinalStep) {
				let finalAddPosition = {};
				if (rootSteps.length === 0) {
					// No root steps, position below trigger
					const triggerPos = savedPositions['trigger'] || {
						x: startX,
						y: startY,
					};
					finalAddPosition = {
						x: triggerPos.x + nodeWidth / 2 - addStepWidth / 2,
						y: triggerPos.y + incrementY,
					};
				} else if (lastRootStep) {
					// Position based on the last root step in the main flow
					const lastRootStepPos = getNodePosition(
						lastRootStep.id.toString()
					);

					finalAddPosition = {
						x: lastRootStepPos.x + nodeWidth / 2 - addStepWidth / 2,
						y: lastRootStepPos.y + incrementY,
					};
				}

				// Check for saved position for final add-step node
				const finalSavedPosition = savedPositions['add-step-final'];

				if (finalAddPosition) {
					initialNodes.push({
						id: 'add-step-final',
						type: 'add_step',
						position: finalSavedPosition || finalAddPosition,
						data: {
							parentId: null,
							condition: null,
							prevStep: lastRootStep,
						},
					});

					// Connect to last root step or trigger
					if (lastRootStep && lastRootStep.type === 'condition') {
						// For root-level condition nodes, connect from the merge node
						const mergeId = `merge-${lastRootStep.id}-level-0`; // Root level is level 0

						// Check if merge node actually exists (in case we skipped creating it)
						const mergeNodeExists = initialNodes.some(
							(node) => node.id === mergeId
						);

						if (mergeNodeExists) {
							initialEdges.push({
								id: `${mergeId}-to-add-final`,
								source: mergeId,
								target: 'add-step-final',
								type: 'addStepEdge',
								style: {
									stroke: '#D7D7DA',
									strokeWidth: 2,
								},
								data: {
									sourceStep: { id: mergeId, type: 'merge' },
									targetStep: undefined, // adding at end
									fromMerge: true,
								},
							});
						} else {
							// If no merge node, connect directly from the condition
							initialEdges.push({
								id: `${lastRootStep.id}-to-add-final`,
								source: lastRootStep.id.toString(),
								target: 'add-step-final',
								type: 'addStepEdge',
								data: {
									sourceStep: lastRootStep,
									targetStep: undefined, // adding at end
								},
							});
						}
					} else {
						// For other step types, use addStepEdge
						const sourceId = result.lastStepId || 'trigger';
						initialEdges.push({
							id: `${sourceId}-to-add-final`,
							source: sourceId,
							target: 'add-step-final',
							type: 'addStepEdge',
							data: {
								sourceStep: lastRootStep,
								targetStep: undefined, // adding at end
							},
						});
					}
				}
			}
		}
		addFinalAddStep();

		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [
		automation?.id,
		automation?.settings?.reactflow_positions,
		steps,
		onStepClick,
		onDeleteStep,
		clearSavedPositions,
	]);

	// Detect significant structural changes and auto-clear positions for better layout
	const [previousStepStructure, setPreviousStepStructure] =
		useState<string>('');

	useEffect(() => {
		if (!steps || steps.length === 0) return;

		// Create a signature of the step structure including nesting and step counts per branch
		const conditionSteps = steps.filter(
			(step) => step.type === 'condition'
		);
		const structureSignature = conditionSteps
			.map((condition) => {
				const yesChildren = steps.filter(
					(s) => s.parent_id === condition.id && s.condition === 'yes'
				);
				const noChildren = steps.filter(
					(s) => s.parent_id === condition.id && s.condition === 'no'
				);
				return `${condition.id}:${condition.parent_id || 0}:${yesChildren.length}:${noChildren.length}`;
			})
			.sort()
			.join('|');

		// If structure has changed significantly, clear positions for re-layout
		if (
			previousStepStructure &&
			previousStepStructure !== structureSignature
		) {
			// Check if children were added to any existing condition
			const currentCounts = new Map<
				number,
				{ yes: number; no: number }
			>();
			const previousCounts = new Map<
				number,
				{ yes: number; no: number }
			>();

			// Parse current structure
			conditionSteps.forEach((condition) => {
				const yesCount = steps.filter(
					(s) => s.parent_id === condition.id && s.condition === 'yes'
				).length;
				const noCount = steps.filter(
					(s) => s.parent_id === condition.id && s.condition === 'no'
				).length;
				currentCounts.set(condition.id, { yes: yesCount, no: noCount });
			});

			// Parse previous structure
			if (previousStepStructure) {
				previousStepStructure.split('|').forEach((entry) => {
					const [conditionId, , yesCount, noCount] = entry.split(':');
					if (
						conditionId &&
						yesCount !== undefined &&
						noCount !== undefined
					) {
						previousCounts.set(parseInt(conditionId), {
							yes: parseInt(yesCount),
							no: parseInt(noCount),
						});
					}
				});
			}

			// Check if any condition got new children (which affects merge positioning)
			let shouldClearPositions = false;
			currentCounts.forEach((current, conditionId) => {
				const previous = previousCounts.get(conditionId);
				if (
					previous &&
					(current.yes > previous.yes || current.no > previous.no)
				) {
					shouldClearPositions = true;
				}
			});

			if (shouldClearPositions) {
				clearSavedPositions();
			}
		}

		setPreviousStepStructure(structureSignature);
	}, [steps, clearSavedPositions, previousStepStructure]);

	// Save node positions when they change
	const saveNodePositions = useCallback(
		async (nodes: Node[]) => {
			if (!automation) return;

			const positions: Record<string, { x: number; y: number }> = {};
			nodes.forEach((node) => {
				positions[node.id] = node.position;
			});

			// Check if positions have actually changed to avoid unnecessary saves
			const currentPositions =
				automation.settings?.reactflow_positions || {};
			const hasChanges = Object.keys(positions).some((nodeId) => {
				const current = currentPositions[nodeId];
				const new_ = positions[nodeId];
				return (
					!current ||
					Math.abs(current.x - new_.x) > 2 || // Threshold to reduce API calls
					Math.abs(current.y - new_.y) > 2
				);
			});

			if (!hasChanges) {
				console.log('No position changes detected, skipping save');
				return;
			}

			try {
				// Update automation settings with new positions
				const updatedAutomation = {
					...automation,
					settings: {
						...automation.settings,
						reactflow_positions: positions,
					},
				};

				// Don't await the API call to avoid blocking the UI
				apiFetch({
					path: `/qc/v1/automations/${automation.id}`,
					method: 'POST',
					data: updatedAutomation,
				}).catch((error) => {
					console.error('Failed to save node positions:', error);
				});

				// Update context immediately for responsive feel
				updateAutomation(updatedAutomation);
			} catch (error) {
				console.error('Failed to save node positions:', error);
			}
		},
		[automation, updateAutomation]
	);

	// Handle node clicks
	const onNodeClick: NodeMouseHandler = useCallback(
		(_event, node) => {
			if (node.id === 'trigger' && onTriggerClick) {
				onTriggerClick();
			} else if (
				node.id !== 'trigger' &&
				!node.id.startsWith('add-step') &&
				onStepClick
			) {
				// Find the step data
				const step = steps?.find((s) => s.id.toString() === node.id);
				if (step) {
					onStepClick({
						...step,
						children: [], // Will be populated if needed by the consuming component
					});
				}
			}
		},
		[onStepClick, onTriggerClick, steps]
	);

	// Handle node changes
	const handleNodesChange = useCallback(
		(changes: any[]) => {
			onNodesChange(changes);
		},
		[onNodesChange]
	);

	if (isLoading) {
		return (
			<div className="qcrm-reactflow-loading">
				{__('Loading workflow...', 'quillcrm')}
			</div>
		);
	}

	return (
		<div className="qcrm-reactflow-workflow">
			<div className="qcrm-reactflow-workflow__layout">
				<div className="qcrm-reactflow-workflow__canvas">
					<ReactFlow
						nodes={nodesState}
						edges={edgesState}
						onNodesChange={handleNodesChange}
						onEdgesChange={onEdgesChange}
						onNodeClick={onNodeClick}
						nodeTypes={nodeTypes}
						edgeTypes={edgeTypes}
						fitView
						fitViewOptions={{ padding: 0.2 }}
						nodesConnectable={false}
						elementsSelectable={true}
						nodesDraggable={false}
						selectNodesOnDrag={false}
						panOnDrag={true}
						zoomOnScroll={true}
						zoomOnPinch={true}
						deleteKeyCode={null}
						defaultEdgeOptions={{
							animated: false,
							type: 'default',
							style: {
								stroke: '#D7D7DA',
								strokeWidth: 2,
								strokeLinecap: 'round',
								strokeLinejoin: 'round',
							},
						}}
						elevateEdgesOnSelect={true}
						elevateNodesOnSelect={false}
						snapToGrid={false}
						snapGrid={[15, 15]}
						edgesFocusable={false}
						edgesReconnectable={false}
					>
						<Background />
						<Controls />

						{/* Only show MiniMap when there are nodes */}
						{nodesState.length > 0 && (
							<MiniMap
								nodeStrokeWidth={3}
								nodeColor={(node) => {
									switch (node.type) {
										case 'trigger':
											return '#1890ff';
										case 'action':
											return '#52c41a';
										case 'condition':
											return '#faad14';
										case 'goal':
											return '#722ed1';
										case 'end_automation':
											return '#f5222d';
										case 'add_step':
											return '#d9d9d9';
										default:
											return '#d9d9d9';
									}
								}}
								nodeStrokeColor="#666"
								maskColor="rgba(240, 240, 240, 0.6)"
								style={{
									height: 120,
									width: 200,
									border: '1px solid #e8e8e8',
									borderRadius: '4px',
								}}
								zoomable
								pannable
								position="bottom-right"
							/>
						)}
					</ReactFlow>
				</div>
			</div>
		</div>
	);
};

export default WorkflowVisualization;
