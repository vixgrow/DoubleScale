/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useCallback, useEffect, useRef } from '@wordpress/element';
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
import { debounce } from 'lodash';
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
	const isInitialLoadRef = useRef(true);
	const isDraggingRef = useRef(false);
	// Create nodes and edges from steps with proper hierarchical handling
	const { nodes, edges } = useMemo(() => {
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
			data: { automation },
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

			return { nodes: initialNodes, edges: initialEdges };
		}

		// Helper function to calculate positions with fallback to saved positions
		const calculatePosition = (
			nodeId: string,
			index: number,
			level: number = 0,
			offset: number = 0
		) => {
			// Check if we have a saved position first
			if (savedPositions[nodeId]) {
				return savedPositions[nodeId];
			}

			// Fallback to calculated position
			const baseX = 250;
			const baseY = 200;
			const verticalSpacing = 180;
			const horizontalSpacing = 300;

			return {
				x: baseX + level * horizontalSpacing + offset,
				y: baseY + index * verticalSpacing,
			};
		};

		// Helper function to find the bottom-most Y position of nodes in a branch
		const findBottomMostPosition = (
			branchSteps: AutomationStep[],
			parentStep: AutomationStep,
			level: number,
			offset: number = 0
		) => {
			if (branchSteps.length === 0) {
				// No children, position below parent
				const parentPos =
					savedPositions[parentStep.id.toString()] ||
					calculatePosition(parentStep.id.toString(), 0, level - 1);
				return {
					x: parentPos.x + offset,
					y: parentPos.y + 180, // Standard spacing below parent
				};
			}

			// Find the bottom-most child position
			let bottomMostY = 0;
			let bottomMostX = 250; // Default center

			branchSteps.forEach((step, index) => {
				const stepPos =
					savedPositions[step.id.toString()] ||
					calculatePosition(step.id.toString(), index, level, offset);
				if (stepPos.y > bottomMostY) {
					bottomMostY = stepPos.y;
					bottomMostX = stepPos.x;
				}
			});

			// Ensure we have a valid position
			if (bottomMostY === 0) {
				const parentPos =
					savedPositions[parentStep.id.toString()] ||
					calculatePosition(
						parentStep.id.toString(),
						0,
						level - 1,
						0
					);
				return {
					x: parentPos.x + offset,
					y: parentPos.y + 180,
				};
			}

			return {
				x: bottomMostX,
				y: bottomMostY + 180, // Position below the bottom-most child
			};
		};

		// Helper function to find position for condition branch add-step nodes
		const findConditionBranchPosition = (
			branchSteps: AutomationStep[],
			parentStep: AutomationStep,
			condition: 'yes' | 'no',
			level: number
		) => {
			const parentPos =
				savedPositions[parentStep.id.toString()] ||
				calculatePosition(parentStep.id.toString(), 0, level - 1);

			if (branchSteps.length === 0) {
				// No children in this branch - position to the right of condition node
				const horizontalSpacing = 300;
				const verticalOffset = condition === 'yes' ? -40 : 40; // Offset yes above, no below

				return {
					x: parentPos.x + horizontalSpacing,
					y: parentPos.y + verticalOffset,
				};
			}

			// Find the bottom-most child position in this branch
			let bottomMostY = 0;
			let bottomMostX = parentPos.x + 300; // Default to right side

			branchSteps.forEach((step, index) => {
				const stepPos =
					savedPositions[step.id.toString()] ||
					calculatePosition(
						step.id.toString(),
						index,
						level,
						condition === 'yes' ? -100 : 100
					);
				if (stepPos.y > bottomMostY) {
					bottomMostY = stepPos.y;
					bottomMostX = stepPos.x;
				}
			});

			return {
				x: bottomMostX,
				y: bottomMostY + 180, // Position below the bottom-most child
			};
		};

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
				const position = calculatePosition(
					step.id.toString(),
					currentIndex,
					level
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
					const parentStep = stepList.find((s) => s.id === parentId);
					initialEdges.push({
						id: `${parentId}-${condition}-to-${step.id}`,
						source: parentId.toString(),
						target: step.id.toString(),
						sourceHandle: condition,
						type: 'smoothstep', // Use regular edge for condition branches
						label,
						style: {
							stroke: condition === 'yes' ? '#52c41a' : '#ff4d4f',
							strokeWidth: 2,
						},
						markerEnd: {
							type: MarkerType.ArrowClosed,
							color: condition === 'yes' ? '#52c41a' : '#ff4d4f',
						},
					});
				} else if (stepIndex > 0) {
					// Connect to previous sibling
					const prevStep = currentLevelSteps[stepIndex - 1];

					// Create connection - if previous step is a condition, use the "continue" handle
					const sourceHandle =
						prevStep.type === 'condition' ? 'continue' : undefined;

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

					// Add add-step nodes for condition branches if they don't end with end_automation
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

					// Add step node for yes branch if no children or last child is not end_automation
					if (
						yesChildren.length === 0 ||
						yesChildren[yesChildren.length - 1].type !==
							'end_automation'
					) {
						const yesAddPosition = findConditionBranchPosition(
							yesChildren,
							step,
							'yes',
							level + 1
						);

						initialNodes.push({
							id: `add-step-${step.id}-yes`,
							type: 'add_step',
							position: yesAddPosition,
							data: {
								parentId: step.id,
								condition: 'yes',
								prevStep:
									yesChildren.length > 0
										? yesChildren[yesChildren.length - 1]
										: null,
							},
						});

						// Connect to last yes child or condition node
						const sourceId =
							yesChildren.length > 0
								? yesChildren[
										yesChildren.length - 1
									].id.toString()
								: step.id.toString();
						const sourceHandle =
							yesChildren.length === 0 ? 'yes' : undefined;
						const label =
							yesChildren.length === 0
								? __('Yes', 'quillcrm')
								: undefined;

						initialEdges.push({
							id: `${sourceId}-yes-to-add-${step.id}-yes`,
							source: sourceId,
							target: `add-step-${step.id}-yes`,
							sourceHandle,
							type: 'addStepEdge',
							label,
							style:
								yesChildren.length === 0
									? {
											stroke: '#52c41a',
											strokeWidth: 2,
										}
									: undefined,
							markerEnd:
								yesChildren.length === 0
									? {
											type: MarkerType.ArrowClosed,
											color: '#52c41a',
										}
									: undefined,
							data: {
								sourceStep: step,
								targetStep: undefined, // adding to yes branch
								condition: 'yes',
							},
						});
					}

					// Add step node for no branch if no children or last child is not end_automation
					if (
						noChildren.length === 0 ||
						noChildren[noChildren.length - 1].type !==
							'end_automation'
					) {
						const noAddPosition = findConditionBranchPosition(
							noChildren,
							step,
							'no',
							level + 1
						);

						initialNodes.push({
							id: `add-step-${step.id}-no`,
							type: 'add_step',
							position: noAddPosition,
							data: {
								parentId: step.id,
								condition: 'no',
								prevStep:
									noChildren.length > 0
										? noChildren[noChildren.length - 1]
										: null,
							},
						});

						// Connect to last no child or condition node
						const sourceId =
							noChildren.length > 0
								? noChildren[
										noChildren.length - 1
									].id.toString()
								: step.id.toString();
						const sourceHandle =
							noChildren.length === 0 ? 'no' : undefined;
						const label =
							noChildren.length === 0
								? __('No', 'quillcrm')
								: undefined;

						initialEdges.push({
							id: `${sourceId}-no-to-add-${step.id}-no`,
							source: sourceId,
							target: `add-step-${step.id}-no`,
							sourceHandle,
							type: 'addStepEdge',
							label,
							style:
								noChildren.length === 0
									? {
											stroke: '#ff4d4f',
											strokeWidth: 2,
										}
									: undefined,
							markerEnd:
								noChildren.length === 0
									? {
											type: MarkerType.ArrowClosed,
											color: '#ff4d4f',
										}
									: undefined,
							data: {
								sourceStep: step,
								targetStep: undefined, // adding to no branch
								condition: 'no',
							},
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

		if (
			rootSteps.length === 0 ||
			rootSteps[rootSteps.length - 1].type !== 'end_automation'
		) {
			// Find the bottom-most position among all nodes to place the final add-step
			let finalAddPosition;
			if (rootSteps.length === 0) {
				// No root steps, position below trigger
				const triggerPos = savedPositions['trigger'] || {
					x: 250,
					y: 50,
				};
				finalAddPosition = {
					x: triggerPos.x,
					y: triggerPos.y + 180,
				};
			} else {
				// Find the absolute bottom-most node position across all branches
				let bottomMostY = 0;
				let bottomMostX = 250; // Default center

				// Check all nodes (including nested ones) to find the bottom-most position
				const allSteps = [...steps];
				allSteps.forEach((step) => {
					const stepPos =
						savedPositions[step.id.toString()] ||
						calculatePosition(
							step.id.toString(),
							step.order - 1,
							0
						);
					if (stepPos.y > bottomMostY) {
						bottomMostY = stepPos.y;
						bottomMostX = stepPos.x;
					}
				});

				finalAddPosition = {
					x: bottomMostX,
					y: bottomMostY + 180,
				};
			}
			initialNodes.push({
				id: 'add-step-final',
				type: 'add_step',
				position: finalAddPosition,
				data: {
					parentId: null,
					condition: null,
					prevStep:
						rootSteps.length > 0
							? rootSteps[rootSteps.length - 1]
							: null,
				},
			});

			// Connect to last root step or trigger
			const sourceId = result.lastStepId || 'trigger';
			const lastRootStep =
				rootSteps.length > 0
					? rootSteps[rootSteps.length - 1]
					: undefined;

			// If last step is a condition, use the "continue" handle
			const sourceHandle =
				lastRootStep?.type === 'condition' ? 'continue' : undefined;

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

		return { nodes: initialNodes, edges: initialEdges };
	}, [
		automation?.id,
		automation?.settings?.reactflow_positions,
		steps,
		onStepClick,
	]);

	// Set up ReactFlow state - initialize with computed values
	const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
	const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

	// Sync ReactFlow state with computed values when they change
	useEffect(() => {
		// Immediately update nodes when the computed nodes change
		setNodes(nodes);

		// Mark initial load as complete after first render
		if (isInitialLoadRef.current) {
			setTimeout(() => {
				isInitialLoadRef.current = false;
			}, 1000);
		}
	}, [nodes, setNodes]);

	useEffect(() => {
		setEdges(edges);
	}, [edges, setEdges]);

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
					Math.abs(current.x - new_.x) > 1 ||
					Math.abs(current.y - new_.y) > 1
				);
			});

			if (!hasChanges) return;

			try {
				// Update automation settings with new positions
				const updatedAutomation = {
					...automation,
					settings: {
						...automation.settings,
						reactflow_positions: positions,
					},
				};

				await apiFetch({
					path: `/qc/v1/automations/${automation.id}`,
					method: 'POST',
					data: updatedAutomation,
				});

				// Only update context when there are actual changes
				updateAutomation(updatedAutomation);
			} catch (error) {
				console.error('Failed to save node positions:', error);
			}
		},
		[automation, updateAutomation]
	);

	// Debounced position saving to avoid too many API calls for drag operations
	const debouncedSavePositions = useCallback(
		debounce((nodes: Node[]) => {
			saveNodePositions(nodes);
		}, 800), // Increased debounce time to reduce API calls and improve performance
		[saveNodePositions]
	);

	// Handle node changes (including position updates)
	const handleNodesChange = useCallback(
		(changes: any[]) => {
			onNodesChange(changes);

			// Check for different types of changes
			const hasPositionChange = changes.some(
				(change) => change.type === 'position' && change.position
			);
			const hasDragStart = changes.some(
				(change) => change.type === 'select' && change.selected
			);
			const hasDragEnd = changes.some(
				(change) => change.type === 'position' && !change.dragging
			);

			// Track dragging state
			if (hasDragStart) {
				isDraggingRef.current = true;
			}
			if (hasDragEnd) {
				isDraggingRef.current = false;
			}

			// Only save positions when drag is complete and not during initial load
			if (
				hasPositionChange &&
				!isDraggingRef.current &&
				!isInitialLoadRef.current
			) {
				debouncedSavePositions(nodesState);
			}
		},
		[onNodesChange, debouncedSavePositions, nodesState]
	);

	// Save positions when nodes structure changes (new steps added/removed) with debounce
	useEffect(() => {
		if (nodes.length > 0 && automation && !isInitialLoadRef.current) {
			// Use debounced save for structure changes too to avoid performance issues
			const timeoutId = setTimeout(() => {
				saveNodePositions(nodes);
			}, 300); // Slightly longer delay for structure changes

			return () => clearTimeout(timeoutId);
		}
	}, [nodes.length, automation]); // Remove saveNodePositions from deps to prevent unnecessary re-renders

	if (isLoading) {
		return (
			<div className="qcrm-reactflow-loading">
				{__('Loading workflow...', 'quillcrm')}
			</div>
		);
	}

	return (
		<div className="qcrm-reactflow-workflow">
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
			>
				<Background />
				<Controls />
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
							default:
								return '#d9d9d9';
						}
					}}
				/>
			</ReactFlow>
		</div>
	);
};

export default WorkflowVisualization;
