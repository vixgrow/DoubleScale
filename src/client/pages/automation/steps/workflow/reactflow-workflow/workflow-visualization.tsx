/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import {
	ReactFlow,
	Node,
	Edge,
	useNodesState,
	useEdgesState,
	MarkerType,
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
import AddStepEdge from './edges/add-step-edge';
import ConditionEdge from './edges/condition-edge';
import { useAutoLayout } from './auto-layout';

// Register custom node types
const nodeTypes = {
	trigger: TriggerNode,
	action: ActionNode,
	condition: ConditionNode,
	goal: GoalNode,
	end_automation: EndNode,
	add_step: AddStepNode,
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
			const branchSteps = stepList
				.filter((step) => {
					if (parentId === null) {
						return !step.parent_id;
					}
					return (
						step.parent_id === parentId &&
						step.condition === condition
					);
				})
				.sort((a, b) => a.order - b.order);

			if (branchSteps.length === 0) {
				return 280; // Minimum width for empty branch
			}

			let maxWidth = 280; // Base node width

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
					const conditionWidth = yesWidth + noWidth + 100; // 100px spacing between branches
					maxWidth = Math.max(maxWidth, conditionWidth);
				}
			});

			return maxWidth;
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
						return !step.parent_id;
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

					// Position condition node at center
					positionMap.set(stepId, { x: centerX, y: currentY });

					// Calculate child positions
					const childY = currentY + 320; // More space below condition
					const totalChildWidth = yesWidth + noWidth + 100; // 100px between branches

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

					// Set currentY to be after the condition branches with more spacing
					currentY = Math.max(currentY + 400, maxBranchEndY + 150);
				} else {
					// For non-condition nodes, position normally
					positionMap.set(stepId, { x: centerX, y: currentY });
					currentY += 250; // Increased spacing between regular steps
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
					// Enhanced positioning that considers nesting level
					const baseY = parentPosition.y + 320; // Increased spacing below parent
					const branchWidth = calculateBranchWidth(
						steps,
						step.parent_id,
						step.condition
					);
					const branchOffset =
						step.condition === 'yes'
							? -branchWidth / 2
							: branchWidth / 2;
					const stepOffset = (stepIndex || 0) * 250; // Increased spacing between steps in same branch

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
						(parentId === null && !step.parent_id) ||
						(parentId !== null &&
							step.parent_id === parentId &&
							step.condition === condition)
				)
				.sort((a, b) => a.order - b.order);

			let currentIndex = startIndex;

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
					// Connect first child to parent with condition label - NO + button on condition branches
					const label =
						condition === 'yes'
							? __('Yes', 'quillcrm')
							: __('No', 'quillcrm');

					initialEdges.push({
						id: `${parentId}-${condition}-to-${step.id}`,
						source: parentId.toString(),
						target: step.id.toString(),
						sourceHandle: condition,
						type: 'conditionEdge', // Use custom condition edge for branches
						label,
						data: {
							condition,
							sourceStep: stepList.find((s) => s.id === parentId),
							targetStep: step,
						},
						markerEnd: MarkerType.ArrowClosed,
					});
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
					// Process yes children
					const yesResult = processStepHierarchy(
						stepList,
						step.id,
						'yes',
						level + 1,
						0
					);

					// Process no children - position them below yes children
					const noStartIndex = yesResult.lastIndex + 1;
					const noResult = processStepHierarchy(
						stepList,
						step.id,
						'no',
						level + 1,
						noStartIndex
					);

					// Ensure condition edges exist for both branches, even if empty
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

					// Create condition edges for empty branches to ensure "Yes"/"No" labels always appear
					if (yesChildren.length === 0) {
						// Create a "Yes" edge to an add-step node for empty yes branch
						const yesAddId = `add-step-${step.id}-yes-empty`;
						const conditionPos = getNodePosition(
							step.id.toString()
						);
						const yesWidth = calculateBranchWidth(
							stepList,
							step.id,
							'yes'
						);
						const noWidth = calculateBranchWidth(
							stepList,
							step.id,
							'no'
						);
						const totalChildWidth = yesWidth + noWidth + 100;

						const yesAddPosition = savedPositions[yesAddId] || {
							x:
								conditionPos.x -
								totalChildWidth / 2 +
								yesWidth / 2, // Properly positioned in yes branch
							y: conditionPos.y + 320, // Below condition with more spacing
						};

						initialNodes.push({
							id: yesAddId,
							type: 'add_step',
							position: yesAddPosition,
							data: {
								parentId: step.id,
								condition: 'yes',
								prevStep: null,
							},
						});

						initialEdges.push({
							id: `${step.id}-yes-to-empty-add`,
							source: step.id.toString(),
							target: yesAddId,
							sourceHandle: 'yes',
							type: 'conditionEdge',
							label: __('Yes', 'quillcrm'),
							data: {
								condition: 'yes',
								sourceStep: step,
								targetStep: undefined,
							},
							markerEnd: MarkerType.ArrowClosed,
						});
					}

					if (noChildren.length === 0) {
						// Create a "No" edge to an add-step node for empty no branch
						const noAddId = `add-step-${step.id}-no-empty`;
						const conditionPos = getNodePosition(
							step.id.toString()
						);
						const yesWidth = calculateBranchWidth(
							stepList,
							step.id,
							'yes'
						);
						const noWidth = calculateBranchWidth(
							stepList,
							step.id,
							'no'
						);
						const totalChildWidth = yesWidth + noWidth + 100;

						const noAddPosition = savedPositions[noAddId] || {
							x:
								conditionPos.x +
								totalChildWidth / 2 -
								noWidth / 2, // Properly positioned in no branch
							y: conditionPos.y + 320, // Below condition with more spacing
						};

						initialNodes.push({
							id: noAddId,
							type: 'add_step',
							position: noAddPosition,
							data: {
								parentId: step.id,
								condition: 'no',
								prevStep: null,
							},
						});

						initialEdges.push({
							id: `${step.id}-no-to-empty-add`,
							source: step.id.toString(),
							target: noAddId,
							sourceHandle: 'no',
							type: 'conditionEdge',
							label: __('No', 'quillcrm'),
							data: {
								condition: 'no',
								sourceStep: step,
								targetStep: undefined,
							},
							markerEnd: MarkerType.ArrowClosed,
						});
					}

					// Add continuation add-step nodes for branches that have children
					const lastYesChild =
						yesChildren.length > 0
							? yesChildren[yesChildren.length - 1]
							: null;

					// Only add continuation add-step for yes branch if it has children and needs continuation
					const shouldAddYesStep =
						yesChildren.length > 0 &&
						(!lastYesChild ||
							(lastYesChild.type !== 'end_automation' &&
								lastYesChild.type !== 'condition'));

					if (shouldAddYesStep) {
						const yesAddId = `add-step-${step.id}-yes`;
						const conditionPos = getNodePosition(
							step.id.toString()
						);
						const yesWidth = calculateBranchWidth(
							stepList,
							step.id,
							'yes'
						);
						const noWidth = calculateBranchWidth(
							stepList,
							step.id,
							'no'
						);
						const totalChildWidth = yesWidth + noWidth + 100;

						const yesAddPosition = savedPositions[yesAddId] || {
							x:
								conditionPos.x -
								totalChildWidth / 2 +
								yesWidth / 2, // Properly positioned in yes branch
							y: conditionPos.y + 320 + yesChildren.length * 250, // Below last yes child with increased spacing
						};

						initialNodes.push({
							id: yesAddId,
							type: 'add_step',
							position: yesAddPosition,
							data: {
								parentId: step.id,
								condition: 'yes',
								prevStep: lastYesChild,
							},
						});

						// Connect to last yes child or condition node
						const sourceId = lastYesChild
							? lastYesChild.id.toString()
							: step.id.toString();
						const sourceHandle = !lastYesChild ? 'yes' : undefined;
						const label = !lastYesChild
							? __('Yes', 'quillcrm')
							: undefined;

						initialEdges.push({
							id: `${sourceId}-yes-to-add-${step.id}-yes`,
							source: sourceId,
							target: `add-step-${step.id}-yes`,
							sourceHandle,
							type: !lastYesChild
								? 'conditionEdge'
								: 'addStepEdge', // Use condition edge for direct condition connections
							label,
							data: !lastYesChild
								? {
										condition: 'yes',
										sourceStep: step,
										targetStep: undefined,
									}
								: {
										sourceStep: lastYesChild,
										targetStep: undefined,
									},
							markerEnd: !lastYesChild
								? MarkerType.ArrowClosed
								: undefined,
						});
					}

					// Only add continuation add-step for no branch if it has children and needs continuation
					const lastNoChild =
						noChildren.length > 0
							? noChildren[noChildren.length - 1]
							: null;

					const shouldAddNoStep =
						noChildren.length > 0 &&
						(!lastNoChild ||
							(lastNoChild.type !== 'end_automation' &&
								lastNoChild.type !== 'condition'));

					if (shouldAddNoStep) {
						const noAddId = `add-step-${step.id}-no`;
						const conditionPos = getNodePosition(
							step.id.toString()
						);
						const yesWidth = calculateBranchWidth(
							stepList,
							step.id,
							'yes'
						);
						const noWidth = calculateBranchWidth(
							stepList,
							step.id,
							'no'
						);
						const totalChildWidth = yesWidth + noWidth + 100;

						const noAddPosition = savedPositions[noAddId] || {
							x:
								conditionPos.x +
								totalChildWidth / 2 -
								noWidth / 2, // Properly positioned in no branch
							y: conditionPos.y + 320 + noChildren.length * 250, // Below last no child with increased spacing
						};

						initialNodes.push({
							id: noAddId,
							type: 'add_step',
							position: noAddPosition,
							data: {
								parentId: step.id,
								condition: 'no',
								prevStep: lastNoChild,
							},
						});

						// Connect to last no child or condition node
						const sourceId = lastNoChild
							? lastNoChild.id.toString()
							: step.id.toString();
						const sourceHandle = !lastNoChild ? 'no' : undefined;
						const label = !lastNoChild
							? __('No', 'quillcrm')
							: undefined;

						initialEdges.push({
							id: `${sourceId}-no-to-add-${step.id}-no`,
							source: sourceId,
							target: `add-step-${step.id}-no`,
							sourceHandle,
							type: !lastNoChild
								? 'conditionEdge'
								: 'addStepEdge', // Use condition edge for direct condition connections
							label,
							data: !lastNoChild
								? {
										condition: 'no',
										sourceStep: step,
										targetStep: undefined,
									}
								: {
										sourceStep: lastNoChild,
										targetStep: undefined,
									},
							markerEnd: !lastNoChild
								? MarkerType.ArrowClosed
								: undefined,
						});
					}

					// Update current index to continue after nested structure
					currentIndex =
						Math.max(yesResult.lastIndex, noResult.lastIndex) + 1;
				} else {
					currentIndex++;
				}
			});

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
		const result = processStepHierarchy(steps);

		// Add final add-step node for root level if needed
		const rootSteps = steps
			.filter((step) => !step.parent_id)
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

				// Connect to last root step or trigger (but not if last step is condition)
				const sourceId = result.lastStepId || 'trigger';
				const sourceHandle = undefined;

				// Don't create addStepEdge from condition nodes
				if (lastRootStep && lastRootStep.type === 'condition') {
					// For condition nodes, use straight edge without add-step functionality
					initialEdges.push({
						id: `${sourceId}-to-add-final`,
						source: sourceId,
						target: 'add-step-final',
						sourceHandle,
						type: 'straight',
					});
				} else {
					// For other step types, use addStepEdge
					initialEdges.push({
						id: `${sourceId}-to-add-final`,
						source: sourceId,
						target: 'add-step-final',
						sourceHandle,
						type: 'addStepEdge',
						data: {
							sourceStep: lastRootStep,
							targetStep: undefined, // adding at end
						},
					});
				}
			}
		}

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

			const hasOrphanedPositions = Object.keys(savedPositions).some(
				(nodeId) => {
					// Skip add-step nodes as they're dynamic
					if (nodeId.startsWith('add-step')) return false;
					return !currentStepIds.has(nodeId);
				}
			);

			// Force auto-layout if we have orphaned positions
			const shouldForceLayout = hasOrphanedPositions;

			console.log(
				'hasExistingPositions (ALL steps have positions)',
				hasExistingPositions
			);
			console.log('hasOrphanedPositions', hasOrphanedPositions);
			console.log('shouldForceLayout', shouldForceLayout);
			console.log('steps.length > 0', steps.length > 0);
			console.log('initialNodes.length > 1', initialNodes.length > 1);

			// Debug individual step positions
			let stepsWithPositions = 0;
			steps.forEach((step) => {
				const stepId = step.id.toString();
				const hasPosition = !!savedPositions[stepId];
				if (hasPosition) stepsWithPositions++;
				console.log(
					`Step ${stepId} (${step.type}): has saved position = ${hasPosition}`,
					savedPositions[stepId]
				);
			});
			console.log(
				`Summary: ${stepsWithPositions}/${steps.length} steps have saved positions`
			);

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

			console.log('hasNestedConditions', hasNestedConditions);
			console.log('maxConditionDepth', maxConditionDepth);
			console.log(
				'Will run auto-layout?',
				(shouldForceLayout || !hasExistingPositions) &&
					steps.length > 0 &&
					initialNodes.length > 1 &&
					!hasNestedConditions &&
					maxConditionDepth === 0
			);

			// Only auto-layout if there are no existing saved positions OR we have orphaned positions,
			// we have steps, we have multiple nodes, AND we don't have complex nested conditions
			if (
				(shouldForceLayout || !hasExistingPositions) &&
				steps.length > 0 &&
				initialNodes.length > 1 &&
				!hasNestedConditions &&
				maxConditionDepth === 0
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
		onTriggerClick,
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
		(event, node) => {
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
