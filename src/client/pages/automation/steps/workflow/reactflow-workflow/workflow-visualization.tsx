/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from '@wordpress/element';
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
import AddStepEdge from './edges/add-step-edge';
import ConditionEdge from './edges/condition-edge';

// Register custom node types
const nodeTypes = {
	trigger: TriggerNode,
	action: ActionNode,
	condition: ConditionNode,
	goal: GoalNode,
	end_automation: EndNode,
	add_step: AddStepNode,
	merge: MergeNode,
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
			const baseWidth = 200; // Increased base width for better spacing
			const levelMultiplier = 1 + level * 0.1; // Better spacing per level
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

					// Enhanced spacing calculation with better branch separation
					const branchSpacing = Math.max(200, 80 + level * 40); // Better spacing with depth
					const conditionWidth = yesWidth + noWidth + branchSpacing;

					// Ensure minimum width for readability
					const adjustedWidth = Math.max(conditionWidth, minWidth);
					maxWidth = Math.max(maxWidth, adjustedWidth);
				}
			});

			// Add extra padding for complex branches with increased padding
			const complexityPadding = level > 0 ? 150 + level * 75 : 75;
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

					// For condition nodes, use the step index to calculate proper Y position
					// This ensures conditions are positioned correctly regardless of other steps
					const conditionY = startY + stepIndex * 300;

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
					const baseBottomSpacing = 600; // Significantly increased base spacing to avoid crowding
					const mergeSpacing = Math.max(300, 200 + level * 50); // Increased dynamic merge spacing
					const levelSpacing = level * 120; // Much more spacing for each nesting level
					currentY = Math.max(
						conditionY + baseBottomSpacing + levelSpacing,
						maxBranchEndY + mergeSpacing + levelSpacing
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

					// Process yes children
					const yesResult = processStepHierarchy(
						stepList,
						step.id,
						'yes',
						level + 1,
						0
					);

					// Process no children
					const noResult = processStepHierarchy(
						stepList,
						step.id,
						'no',
						level + 1,
						0
					);

					// Store condition step info for later merge node creation
					conditionStepsToProcess.push({
						step,
						level,
						yesChildren,
						noChildren,
					});

					// Update current index to continue after nested structure
					currentIndex =
						Math.max(yesResult.lastIndex, noResult.lastIndex) + 1;
				} else {
					currentIndex++;
				}
			});

			// Now create merge nodes for all condition steps after children are positioned
			conditionStepsToProcess.forEach(
				({ step, level, yesChildren, noChildren }) => {
					const conditionPos = getNodePosition(step.id.toString());

					// Calculate optimal merge position using utility - now all children are positioned
					const optimalMergePosition = calculateMergePosition(
						conditionPos,
						yesChildren,
						noChildren,
						getNodePosition,
						stepList, // Pass all steps for recursive depth calculation
						level // Pass current level for nested merge node tracking
					);

					// Create single merge node positioned below both branches
					// Use level-aware naming to ensure unique merge nodes for nested conditions
					const mergeId = `merge-${step.id}-level-${level}`;
					const mergePosition =
						savedPositions[mergeId] || optimalMergePosition;

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

					initialNodes.push({
						id: mergeId,
						type: 'merge',
						position: mergePosition,
						data: mergeNodeData,
					});

					// Connect condition branches to their respective children or add-steps

					if (yesChildren.length === 0) {
						// For empty yes branch, connect directly to merge with add-step functionality on edge
						initialEdges.push({
							id: `${step.id}-to-yes-merge-direct`,
							source: step.id.toString(),
							target: mergeId,
							sourceHandle: 'yes', // Explicitly use 'yes' handle (left side)
							targetHandle: 'top', // Connect to top handle of merge node
							type: 'addStepEdge',
							label: __('Yes', 'quillcrm'),
							animated: false,
							style: {
								stroke: '#52c41a',
								strokeWidth: 4,
							},
							data: {
								condition: 'yes',
								sourceStep: step,
								targetStep: { id: mergeId, type: 'merge' },
								label: __('Yes', 'quillcrm'),
							},
							className:
								'qcrm-condition-edge qcrm-condition-edge--yes',
						});
					} else {
						// Connect condition directly to first yes child
						const firstYesChild = yesChildren[0];
						initialEdges.push({
							id: `${step.id}-to-yes-${firstYesChild.id}`,
							source: step.id.toString(),
							target: firstYesChild.id.toString(),
							sourceHandle: 'yes', // Explicitly use 'yes' handle (left side)
							targetHandle: null, // Let target use default top handle
							type: 'conditionEdge',
							label: __('Yes', 'quillcrm'),
							animated: false,
							style: {
								stroke: '#52c41a',
								strokeWidth: 4,
							},
							data: {
								condition: 'yes',
								sourceStep: step,
								targetStep: firstYesChild,
								label: __('Yes', 'quillcrm'),
							},
							className:
								'qcrm-condition-edge qcrm-condition-edge--yes',
						});

						// Connect last yes child to merge
						const lastYesChild =
							yesChildren[yesChildren.length - 1];

						// For condition nodes, connect from their merge node instead of directly
						// For regular nodes, connect directly to parent merge
						if (lastYesChild.type === 'condition') {
							// Calculate the level of the child condition to get its merge node ID
							const childConditionLevel = level + 1;
							const childMergeId = `merge-${lastYesChild.id}-level-${childConditionLevel}`;

							// Connect from child's merge node to parent's merge node using default edge type (no add-step functionality)
							initialEdges.push({
								id: `${childMergeId}-to-merge`,
								source: childMergeId,
								target: mergeId,
								targetHandle: 'top', // Connect to top handle of merge node
								type: 'default', // Use default edge type instead of addStepEdge to prevent add-step functionality
								style: {
									stroke: '#52c41a',
									strokeWidth: 2,
								},
								data: {
									sourceStep: {
										id: childMergeId,
										type: 'merge',
									},
									targetStep: { id: mergeId, type: 'merge' },
									fromBranch: 'yes',
									fromChildMerge: true,
								},
							});
						} else {
							// For non-condition nodes, connect directly to parent merge
							const edgeConfig: any = {
								id: `${lastYesChild.id}-to-merge`,
								source: lastYesChild.id.toString(),
								target: mergeId,
								targetHandle: 'top', // Connect to top handle of merge node
								type: 'addStepEdge',
								style: {
									stroke: '#52c41a',
									strokeWidth: 2,
								},
								data: {
									sourceStep: lastYesChild,
									targetStep: { id: mergeId, type: 'merge' },
									fromBranch: 'yes',
								},
							};

							edgeConfig.sourceHandle = undefined;
							initialEdges.push(edgeConfig);
						}
					}

					if (noChildren.length === 0) {
						// For empty no branch, connect directly to merge with add-step functionality on edge
						initialEdges.push({
							id: `${step.id}-to-no-merge-direct`,
							source: step.id.toString(),
							target: mergeId,
							sourceHandle: 'no', // Explicitly use 'no' handle (right side)
							targetHandle: 'top', // Connect to top handle of merge node
							type: 'addStepEdge',
							label: __('No', 'quillcrm'),
							animated: false,
							style: {
								stroke: '#ff4d4f',
								strokeWidth: 4,
							},
							data: {
								condition: 'no',
								sourceStep: step,
								targetStep: { id: mergeId, type: 'merge' },
								label: __('No', 'quillcrm'),
							},
							className:
								'qcrm-condition-edge qcrm-condition-edge--no',
						});
					} else if (noChildren.length > 0) {
						// Connect condition directly to first no child
						const firstNoChild = noChildren[0];
						initialEdges.push({
							id: `${step.id}-to-no-${firstNoChild.id}`,
							source: step.id.toString(),
							target: firstNoChild.id.toString(),
							sourceHandle: 'no', // Explicitly use 'no' handle (right side)
							targetHandle: null, // Let target use default top handle
							type: 'conditionEdge',
							label: __('No', 'quillcrm'),
							animated: false,
							style: {
								stroke: '#ff4d4f',
								strokeWidth: 4,
							},
							data: {
								condition: 'no',
								sourceStep: step,
								targetStep: firstNoChild,
								label: __('No', 'quillcrm'),
							},
							className:
								'qcrm-condition-edge qcrm-condition-edge--no',
						});

						// Connect last no child to merge
						const lastNoChild = noChildren[noChildren.length - 1];

						// For condition nodes, connect from their merge node instead of directly
						// For regular nodes, connect directly to parent merge
						if (lastNoChild.type === 'condition') {
							// Calculate the level of the child condition to get its merge node ID
							const childConditionLevel = level + 1;
							const childMergeId = `merge-${lastNoChild.id}-level-${childConditionLevel}`;

							// Connect from child's merge node to parent's merge node using default edge type (no add-step functionality)
							initialEdges.push({
								id: `${childMergeId}-to-merge`,
								source: childMergeId,
								target: mergeId,
								targetHandle: 'top', // Connect to top handle of merge node
								type: 'default', // Use default edge type instead of addStepEdge to prevent add-step functionality
								style: {
									stroke: '#ff4d4f',
									strokeWidth: 2,
								},
								data: {
									sourceStep: {
										id: childMergeId,
										type: 'merge',
									},
									targetStep: { id: mergeId, type: 'merge' },
									fromBranch: 'no',
									fromChildMerge: true,
								},
							});
						} else {
							// For non-condition nodes, connect directly to parent merge
							const edgeConfig: any = {
								id: `${lastNoChild.id}-to-merge`,
								source: lastNoChild.id.toString(),
								target: mergeId,
								targetHandle: 'top', // Connect to top handle of merge node
								type: 'addStepEdge',
								style: {
									stroke: '#ff4d4f',
									strokeWidth: 2,
								},
								data: {
									sourceStep: lastNoChild,
									targetStep: { id: mergeId, type: 'merge' },
									fromBranch: 'no',
								},
							};

							edgeConfig.sourceHandle = undefined;
							initialEdges.push(edgeConfig);
						}
					}

					// Add continuation add-step functionality to edges after existing children
					if (yesChildren.length > 0) {
						const lastYesChild =
							yesChildren[yesChildren.length - 1];
						const shouldAddYesStep =
							lastYesChild.type !== 'end_automation' &&
							lastYesChild.type !== 'condition';

						if (shouldAddYesStep) {
							// Modify the edge from last yes child to merge to include add-step functionality
							const existingEdgeIndex = initialEdges.findIndex(
								(edge) =>
									edge.id === `${lastYesChild.id}-to-merge`
							);

							if (existingEdgeIndex >= 0) {
								// Update the existing edge to include condition data for add-step functionality
								initialEdges[existingEdgeIndex].data = {
									...initialEdges[existingEdgeIndex].data,
									condition: 'yes',
									sourceStep: lastYesChild,
								};
							}
						}
					}

					if (noChildren.length > 0) {
						const lastNoChild = noChildren[noChildren.length - 1];
						const shouldAddNoStep =
							lastNoChild.type !== 'end_automation' &&
							lastNoChild.type !== 'condition';

						if (shouldAddNoStep) {
							// Modify the edge from last no child to merge to include add-step functionality
							const existingEdgeIndex = initialEdges.findIndex(
								(edge) =>
									edge.id === `${lastNoChild.id}-to-merge`
							);

							if (existingEdgeIndex >= 0) {
								// Update the existing edge to include condition data for add-step functionality
								initialEdges[existingEdgeIndex].data = {
									...initialEdges[existingEdgeIndex].data,
									condition: 'no',
									sourceStep: lastNoChild,
								};
							}
						}
					}

					// Check if there are subsequent steps at the same level that need to connect to this merge node
					const subsequentSteps = stepList
						.filter((s) => {
							if (level === 0) {
								// Root level: steps after this condition
								return !s.parent_id && s.order > step.order;
							} else {
								// Nested level: steps after this condition in the same branch
								return (
									s.parent_id === parentId &&
									s.condition === condition &&
									s.order > step.order
								);
							}
						})
						.sort((a, b) => a.order - b.order);

					// If there are subsequent steps, connect merge to the first one
					if (subsequentSteps.length > 0) {
						const nextStep = subsequentSteps[0];
						initialEdges.push({
							id: `${mergeId}-to-${nextStep.id}`,
							source: mergeId,
							target: nextStep.id.toString(),
							type: 'default', // Use default edge type to prevent add-step functionality between merge and regular steps
							style: {
								stroke: '#1890ff',
								strokeWidth: 2,
							},
							data: {
								sourceStep: { id: mergeId, type: 'merge' },
								targetStep: nextStep,
								fromMerge: true,
							},
						});
					} else if (level === 0) {
						// For root-level conditions with no subsequent steps, add final add-step connection
						// This will be handled by the final add-step logic below
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
									stroke: '#1890ff',
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

			console.log('savedPositions', savedPositions);
			console.log('steps', steps);

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
						setTimeout(() => {
							saveNodePositions(layoutResult.nodes);
						}, 500); // Delay to ensure nodes are rendered
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
	]);

	// Clear saved positions to force re-layout
	const clearSavedPositions = useCallback(async () => {
		if (!automation) return;

		console.log(
			'Clearing saved positions to force re-layout after reorder'
		);

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

			console.log('Saving node positions...', {
				totalNodes: nodes.length,
			});

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
								stroke: '#8c8c8c',
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
