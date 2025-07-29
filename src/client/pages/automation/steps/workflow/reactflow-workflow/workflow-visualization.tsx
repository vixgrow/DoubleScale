/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useAutoLayout } from './auto-layout';
import {
	calculateMergePosition,
	createMergeNodeData,
	validateMergeConfiguration,
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
		const initialNodes: Node[] = [];
		const initialEdges: Edge[] = [];

		// Get saved positions from automation settings
		const savedPositions = automation?.settings?.reactflow_positions || {};

		// Always add trigger node at the top
		const triggerPosition = savedPositions['trigger'] || { x: 250, y: 50 };
		initialNodes.push({
			id: 'trigger',
			type: 'trigger',
			position: triggerPosition,
			data: { automation, onTriggerClick },
		});

		if (!steps || steps.length === 0) {
			// Show initial add step node when no steps exist
			const addStepPosition = savedPositions['add-step-initial'] || {
				x: 250,
				y: 200,
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
					sourceStep: undefined, // trigger
					targetStep: undefined, // adding first step
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

			// Calculate minimum width based on level and content with increased base
			const baseWidth = 300; // Increased base width for better spacing
			const levelMultiplier = 1 + level * 0.3; // Better spacing per level
			const minWidth = baseWidth * levelMultiplier;

			// Debug logging for branch calculations
			console.log('calculateBranchWidth', {
				level: level,
				branchSteps: branchSteps.length,
				minWidth: minWidth,
			});

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

					// Enhanced spacing calculation with better branch separation
					const branchSpacing = Math.max(120, 80 + level * 40); // Better spacing with depth
					const conditionWidth = yesWidth + noWidth + branchSpacing;

					// Ensure minimum width for readability
					const adjustedWidth = Math.max(conditionWidth, minWidth);
					maxWidth = Math.max(maxWidth, adjustedWidth);
				}
			});

			// Add extra padding for complex branches with increased padding
			const complexityPadding = level > 0 ? 150 + level * 75 : 75;
			const finalWidth = maxWidth + complexityPadding;

			console.log('calculateBranchWidth', {
				level: level,
				branchSteps: branchSteps.length,
				maxWidth: maxWidth,
				complexityPadding: complexityPadding,
				finalWidth: finalWidth,
			});

			return finalWidth;
		};

		// Position calculator that considers nested structure
		const positionMap = new Map<string, { x: number; y: number }>();

		const calculatePositions = (
			stepList: AutomationStep[],
			parentId: number | null = null,
			condition: string | null = null,
			level: number = 0,
			centerX: number = 250,
			startY: number = 200
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
					const conditionY = currentY;

					// Position condition node at center
					positionMap.set(stepId, { x: centerX, y: conditionY });

					// Calculate child positions with improved spacing - increased significantly for better readability
					const baseSpacing = 450; // Significantly increased base spacing for condition children
					const levelMultiplier = 1 + level * 0.6; // More aggressive spacing per level
					const childY = conditionY + baseSpacing * levelMultiplier;

					// Enhanced branch spacing calculation with better separation
					const branchGap = Math.max(300, 150 + level * 60); // Increased gap based on level
					const totalChildWidth = yesWidth + noWidth + branchGap;

					// Debug logging for branch calculations
					console.log(
						`Condition step ${step.id} at level ${level}:`,
						{
							yesWidth,
							noWidth,
							branchGap,
							totalChildWidth,
							centerX,
							childY,
						}
					);

					// Position yes branch to the left and get its end Y position
					const yesX = centerX - totalChildWidth / 2 + yesWidth / 2;
					const yesEndY = calculatePositions(
						stepList,
						step.id,
						'yes',
						level + 1,
						yesX,
						childY
					);

					// Position no branch to the right and get its end Y position
					const noX = centerX + totalChildWidth / 2 - noWidth / 2;
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

					// Enhanced merge spacing calculation with significantly more space
					// Also check for any nested conditions in children to ensure proper spacing
					const hasNestedConditions = stepList.some(
						(s) => s.parent_id === step.id && s.type === 'condition'
					);

					const baseBottomSpacing = hasNestedConditions ? 800 : 600; // Extra space for nested conditions
					const mergeSpacing = Math.max(300, 200 + level * 50); // Increased dynamic merge spacing
					const levelSpacing = level * 120; // Much more spacing for each nesting level
					const nestedConditionSpacing = hasNestedConditions
						? 400
						: 0; // Additional space for nested structures

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
					positionMap.set(stepId, { x: centerX, y: currentY });
					currentY += 300; // Increased spacing between regular steps for better clarity
				}
			});

			return currentY; // Return the final Y position
		};

		// Helper function to get saved position or calculated position
		const getNodePosition = (
			nodeId: string,
			fallbackX = 250,
			fallbackY = 200,
			step?: AutomationStep,
			stepIndex?: number
		) => {
			// If we have a saved position, use it
			if (savedPositions[nodeId]) {
				return savedPositions[nodeId];
			}

			// Check if we have a calculated position
			if (positionMap.has(nodeId)) {
				return positionMap.get(nodeId)!;
			}

			// Fallback to old logic for edge cases
			if (step && step.parent_id && step.condition) {
				const parentId = step.parent_id.toString();
				const parentPosition =
					savedPositions[parentId] || positionMap.get(parentId);

				if (parentPosition) {
					// Enhanced positioning that considers nesting level with better spacing
					const baseY = parentPosition.y + 200; // Significantly increased spacing below parent
					const branchWidth = calculateBranchWidth(
						steps,
						step.parent_id,
						step.condition
					);
					const branchOffset =
						step.condition === 'yes'
							? -branchWidth / 2
							: branchWidth / 2;
					const stepOffset = (stepIndex || 0) * 300; // Increased spacing between steps in same branch

					return {
						x: parentPosition.x + branchOffset,
						y: baseY + stepOffset,
					};
				}
			}

			// Default fallback
			return { x: fallbackX, y: fallbackY };
		};

		// Calculate all positions first
		calculatePositions(steps);

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
					250,
					200,
					step,
					stepIndex
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
							sourceStep: undefined, // trigger
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
					console.log('=== CONDITION STEP ANALYSIS ===');
					console.log('Condition step ID:', step.id);
					console.log(
						'All steps:',
						stepList.map((s) => ({
							id: s.id,
							type: s.type,
							parent_id: s.parent_id,
							condition: s.condition,
							order: s.order,
						}))
					);

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

					console.log(
						'Yes children found:',
						yesChildren.length,
						yesChildren.map((s) => ({
							id: s.id,
							type: s.type,
							parent_id: s.parent_id,
							condition: s.condition,
						}))
					);
					console.log(
						'No children found:',
						noChildren.length,
						noChildren.map((s) => ({
							id: s.id,
							type: s.type,
							parent_id: s.parent_id,
							condition: s.condition,
						}))
					);
					console.log('=== END CONDITION ANALYSIS ===');

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

					// Calculate the branch center positions using the same logic as calculatePositions
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
					const branchGap = Math.max(300, 150 + level * 60);
					const totalChildWidth = yesWidth + noWidth + branchGap;

					// Calculate exact branch center positions
					const yesX =
						conditionPos.x - totalChildWidth / 2 + yesWidth / 2;
					const noX =
						conditionPos.x + totalChildWidth / 2 - noWidth / 2;

					// Create single merge node positioned below both branches
					const mergeId = `merge-${step.id}-level-${level}`;

					// Create enhanced merge node data with level information
					const mergeNodeData = {
						...createMergeNodeData(step, yesChildren, noChildren),
						level, // Pass the current nesting level for visual distinction
					};

					// Validate merge configuration
					const validation =
						validateMergeConfiguration(mergeNodeData);
					if (!validation.isValid) {
						console.warn(
							`Merge node validation warnings for condition ${step.id}:`,
							validation.warnings
						);
					}

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

					// Calculate merge position based on actual children positions
					// Find the bottommost Y position among all children in both branches
					let maxChildY = Math.max(yesPosition.y, noPosition.y) + 150; // Start with branch positions

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
									childPos.y + 600,
									childMaxBranchY + 200
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

					// Position merge node below all children with proper spacing
					const actualBranchCenterX =
						(yesPosition.x + noPosition.x) / 2;

					// Calculate merge position with extra spacing for nested conditions
					const baseSpacing = 200;
					const nestingMultiplier = level * 100; // More space per nesting level
					const hasNestedConditionsInBranch = [
						...yesChildren,
						...noChildren,
					].some((child) => child.type === 'condition');
					const nestedSpacing = hasNestedConditionsInBranch ? 300 : 0;

					const mergeY =
						maxChildY +
						baseSpacing +
						nestingMultiplier +
						nestedSpacing;

					const optimalMergePosition = {
						x: actualBranchCenterX,
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

					console.log('Created merge node:', {
						mergeId,
						position: mergePosition,
						level,
						stepId: step.id,
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
							x: yesPosition.x,
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

						console.log('Connecting last yes child to merge:', {
							lastYesChildId: lastYesChild.id,
							lastYesChildType: lastYesChild.type,
							mergeId: mergeId,
						});

						if (lastYesChild.type === 'condition') {
							// For child conditions, we don't connect them directly here
							// The connection will be handled by the post-processing function
							// This prevents duplicate edges to the same merge node
							console.log(
								'Skipping direct child condition connection - will be handled in post-processing:',
								{
									childConditionId: lastYesChild.id,
									parentMergeId: mergeId,
									branch: 'yes',
								}
							);
						} else {
							// For regular steps, always connect to the parent merge
							// Child condition merges will be handled separately in post-processing
							console.log(
								'Creating regular step to merge edge (Yes branch):',
								{
									stepId: lastYesChild.id,
									stepType: lastYesChild.type,
									mergeId: mergeId,
									edgeId: `${lastYesChild.id}-to-merge`,
								}
							);

							// Validate that both source and target nodes exist
							const sourceExists = initialNodes.some(
								(node) => node.id === lastYesChild.id.toString()
							);
							const targetExists = initialNodes.some(
								(node) => node.id === mergeId
							);

							console.log('Edge validation (Yes branch):', {
								sourceNodeExists: sourceExists,
								targetNodeExists: targetExists,
								sourceId: lastYesChild.id.toString(),
								targetId: mergeId,
							});

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
								console.log(
									'✅ Yes branch edge created successfully'
								);
							} else {
								console.error(
									'❌ Failed to create Yes branch edge - missing nodes'
								);
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
							x: noPosition.x,
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

						console.log('Connecting last no child to merge:', {
							lastNoChildId: lastNoChild.id,
							lastNoChildType: lastNoChild.type,
							mergeId: mergeId,
						});

						if (lastNoChild.type === 'condition') {
							// For child conditions, we don't connect them directly here
							// The connection will be handled by the post-processing function
							// This prevents duplicate edges to the same merge node
							console.log(
								'Skipping direct child condition connection - will be handled in post-processing:',
								{
									childConditionId: lastNoChild.id,
									parentMergeId: mergeId,
									branch: 'no',
								}
							);
						} else {
							// For regular steps, connect to the parent merge
							// But check if there are any child conditions after this step
							const childConditionsAfter = noChildren.filter(
								(child, index) =>
									index > noChildren.indexOf(lastNoChild) &&
									child.type === 'condition'
							);

							if (childConditionsAfter.length > 0) {
								console.log(
									'Regular step has child conditions after it - skip direct connection',
									{
										stepId: lastNoChild.id,
										childConditionsAfter:
											childConditionsAfter.map(
												(c) => c.id
											),
									}
								);
							} else {
								// Safe to connect regular step to merge
								console.log(
									'Creating regular step to merge edge (No branch):',
									{
										stepId: lastNoChild.id,
										stepType: lastNoChild.type,
										mergeId: mergeId,
										edgeId: `${lastNoChild.id}-to-merge`,
									}
								);

								// Validate that both source and target nodes exist
								const sourceExists = initialNodes.some(
									(node) =>
										node.id === lastNoChild.id.toString()
								);
								const targetExists = initialNodes.some(
									(node) => node.id === mergeId
								);

								console.log('Edge validation (No branch):', {
									sourceNodeExists: sourceExists,
									targetNodeExists: targetExists,
									sourceId: lastNoChild.id.toString(),
									targetId: mergeId,
								});

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
									console.log(
										'✅ No branch edge created successfully'
									);
								} else {
									console.error(
										'❌ Failed to create No branch edge - missing nodes'
									);
								}
							}
						}
					}

					// Check if there are subsequent steps at the same level that need to connect to this merge node
					const subsequentSteps = stepList
						.filter((s) => {
							if (level === 0) {
								return !s.parent_id && s.order > step.order;
							} else {
								return (
									s.parent_id === parentId &&
									s.condition === condition &&
									s.order > step.order
								);
							}
						})
						.sort((a, b) => a.order - b.order);

					// Store information about subsequent steps for later processing
					// We'll handle connections after all merge nodes are created
					if (subsequentSteps.length > 0) {
						console.log('Found subsequent steps for condition:', {
							conditionId: step.id,
							mergeId,
							level,
							subsequentSteps: subsequentSteps.map((s) => ({
								id: s.id,
								type: s.type,
							})),
						});
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
								console.log(
									'Child condition has subsequent steps - skipping direct parent connection:',
									{
										childMergeId,
										parentMergeId,
										condition: conditionStep.condition,
										level,
										subsequentSteps:
											stepsAfterChildCondition.map(
												(s) => ({
													id: s.id,
													type: s.type,
												})
											),
									}
								);
							} else {
								// No subsequent steps, safe to connect directly to parent merge
								// Determine which handle on the parent merge to connect to
								// This should match the condition branch this child belongs to
								const targetHandle = conditionStep.condition;

								console.log(
									'Creating child-to-parent merge connection (no subsequent steps):',
									{
										childMergeId,
										parentMergeId,
										condition: conditionStep.condition,
										level,
										edgeId,
										targetHandle,
									}
								);

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
							console.log(
								'Skipped duplicate child-to-parent merge edge:',
								{
									edgeId,
									childMergeId,
									parentMergeId,
								}
							);
						} else {
							console.log(
								'Missing nodes for child-to-parent merge connection:',
								{
									childMergeExists,
									parentMergeExists,
									childMergeId,
									parentMergeId,
								}
							);
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
							console.log(
								'Connecting child merge to subsequent step:',
								{
									childMergeId,
									nextStepId: nextStep.id,
									nextStepType: nextStep.type,
									condition: conditionStep.condition,
									level,
									edgeId,
								}
							);

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
										console.log(
											'Connecting last branch step to parent merge:',
											{
												stepId: lastNonConditionStep.id,
												stepType:
													lastNonConditionStep.type,
												parentMergeId,
												branchCondition,
												edgeId,
											}
										);

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
											console.log(
												'Connecting truly last branch step to parent merge:',
												{
													stepId: trulyLastStep.id,
													stepType:
														trulyLastStep.type,
													parentMergeId,
													branchCondition,
													edgeId,
												}
											);

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

				console.log('Found last condition in branch:', {
					parentConditionId,
					condition,
					lastConditionId: lastCondition.id,
					lastConditionMergeId,
					branchSteps: branchSteps.map((s) => ({
						id: s.id,
						type: s.type,
						order: s.order,
					})),
				});

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
								console.log(
									'Root merge has child merges - connection will be handled by child merges:',
									{
										mergeId,
										yesLastMerge,
										noLastMerge,
										nextStepId: nextStep.id,
									}
								);
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

									console.log(
										'Connected root merge to subsequent step (no child merges):',
										{
											edgeId,
											mergeId,
											nextStepId: nextStep.id,
											level,
										}
									);
								}
							}
						} else {
							// For child conditions, the connection will flow through parent merge
							console.log(
								'Child merge will flow through parent merge:',
								{
									childMergeId: mergeId,
									level,
									nextStepId: nextStep.id,
								}
							);
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

					console.log(
						'Analyzing final connections for root condition:',
						{
							rootConditionId: rootCondition.id,
							nextStepId: nextStep.id,
							rootMergeId,
							yesLastMerge,
							noLastMerge,
						}
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

							console.log(
								'Connected root merge to subsequent step (final pass):',
								{
									edgeId,
									rootMergeId,
									nextStepId: nextStep.id,
								}
							);
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

							console.log(
								'Connected root merge to subsequent step (with child merges):',
								{
									edgeId,
									rootMergeId,
									nextStepId: nextStep.id,
									yesLastMerge,
									noLastMerge,
								}
							);
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

			console.log('Edge deduplication complete:', {
				originalCount:
					edgeMap.size + (initialEdges.length - uniqueEdges.length),
				finalCount: uniqueEdges.length,
				duplicatesRemoved: initialEdges.length - uniqueEdges.length,
			});
		}

		removeDuplicateEdges();

		// Debug: Log all created edges to help identify missing connections
		console.log('=== EDGE CREATION SUMMARY ===');
		console.log('Total edges created:', initialEdges.length);
		const mergeEdges = initialEdges.filter(
			(edge) =>
				edge.id.includes('-to-merge') || edge.target.includes('merge-')
		);
		console.log('Edges connecting to merge nodes:', mergeEdges.length);
		mergeEdges.forEach((edge) => {
			console.log(
				`  - ${edge.id}: ${edge.source} -> ${edge.target} (handle: ${edge.targetHandle})`
			);
		});
		console.log('=== END EDGE SUMMARY ===');

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
				// Position the final add-step based on the last root step, not the bottommost node
				let finalAddPosition;
				if (rootSteps.length === 0) {
					// No root steps, position below trigger
					const triggerPos = savedPositions['trigger'] || {
						x: 250,
						y: 50,
					};
					finalAddPosition = {
						x: triggerPos.x,
						y: triggerPos.y + 250,
					};
				} else if (lastRootStep) {
					// Position based on the last root step in the main flow
					const lastRootStepPos = getNodePosition(
						lastRootStep.id.toString()
					);

					finalAddPosition = {
						x: lastRootStepPos.x,
						y: lastRootStepPos.y + 250,
					};
				}

				// Check for saved position for final add-step node
				const finalAddId = 'add-step-final';
				const finalSavedPosition = savedPositions[finalAddId];

				if (finalAddPosition) {
					initialNodes.push({
						id: finalAddId,
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

		// Apply auto-layout before setting nodes if no saved positions exist
		const applyLayoutAndSetNodes = async () => {
			// Check if we have any saved positions for step nodes (excluding trigger)

			// Check if ALL current steps have saved positions
			const hasExistingPositions = steps.every(
				(step) => savedPositions[step.id.toString()]
			);

			// Check if there are orphaned positions (positions for non-existent steps)
			const currentStepIds = new Set([
				'trigger',
				...steps.map((step) => step.id.toString()),
				'add-step-initial',
				'add-step-final',
			]);

			// Add merge node IDs for condition steps
			steps.forEach((step) => {
				if (step.type === 'condition') {
					// Calculate the level for this condition step
					let level = 0;
					let currentStep = step;
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
					currentStepIds.add(`merge-${step.id}-level-${level}`);
				}
			});

			const hasOrphanedPositions = Object.keys(savedPositions).some(
				(nodeId) => {
					// Skip add-step nodes as they're dynamic
					if (nodeId.startsWith('add-step')) return false;
					return !currentStepIds.has(nodeId);
				}
			);

			// Force auto-layout if we have orphaned positions
			const shouldForceLayout = hasOrphanedPositions;

			// Debug individual step positions
			let stepsWithPositions = 0;
			steps.forEach((step) => {
				const stepId = step.id.toString();
				const hasPosition = !!savedPositions[stepId];
				if (hasPosition) stepsWithPositions++;
			});

			// Check if this has complex nested conditions that should use our custom positioning
			const hasNestedConditions = steps.some((step) => {
				if (step.type !== 'condition') return false;
				// Check if any step is a child of this condition and is also a condition
				return steps.some(
					(child) =>
						child.parent_id === step.id &&
						child.type === 'condition'
				);
			});

			// Check if there are ANY condition nodes that need custom positioning
			const hasConditionNodes = steps.some(
				(step) => step.type === 'condition'
			);

			// Also check for multiple condition levels
			const maxConditionDepth = steps.reduce((maxDepth, step) => {
				if (step.type !== 'condition') return maxDepth;
				let depth = 0;
				let currentStep = step;
				while (currentStep.parent_id) {
					const parent = steps.find(
						(s) => s.id === currentStep.parent_id
					);
					if (parent && parent.type === 'condition') {
						depth++;
						currentStep = parent;
					} else {
						break;
					}
				}
				return Math.max(maxDepth, depth);
			}, 0);

			// Only auto-layout if there are no existing saved positions OR we have orphaned positions,
			// we have steps, we have multiple nodes, AND we don't have ANY condition nodes
			if (
				(shouldForceLayout || !hasExistingPositions) &&
				steps.length > 0 &&
				initialNodes.length > 1 &&
				!hasConditionNodes
			) {
				try {
					// Apply layout to get better positioned nodes
					const layoutResult = await useAutoLayout(
						[...initialNodes],
						[...initialEdges]
					);

					if (layoutResult) {
						setNodes(layoutResult.nodes);
						setEdges(layoutResult.edges);
						// Save the automatically arranged positions
						// setTimeout(() => {
						// 	saveNodePositions(layoutResult.nodes);
						// }, 500); // Delay to ensure nodes are rendered
						return;
					}
				} catch (error) {
					console.error('Failed to apply initial layout:', error);
				}
			}

			// Fallback: set nodes without layout (safer for asymmetric conditions)
			// This prevents branch interference when adding steps to only one condition branch
			setNodes(initialNodes);
			setEdges(initialEdges);
		};

		applyLayoutAndSetNodes();
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
					console.log(
						`Condition ${conditionId} got new children: ${JSON.stringify({ previous, current })}`
					);
				}
			});

			if (shouldClearPositions) {
				console.log(
					'Detected children added to conditions, clearing positions for better merge layout'
				);
				clearSavedPositions();
			}
		}

		setPreviousStepStructure(structureSignature);
	}, [steps, clearSavedPositions, previousStepStructure]);

	useEffect(() => {
		console.log('Node State', nodesState);
	}, [nodesState]);

	useEffect(() => {
		console.log('Edges State', edgesState);
	}, [edgesState]);

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
