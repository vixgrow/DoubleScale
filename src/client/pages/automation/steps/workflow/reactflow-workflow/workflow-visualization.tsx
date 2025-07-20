/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useMemo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
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
	// Track previous node count to detect additions/deletions
	const prevNodeCountRef = useRef(0);
	const shouldTriggerLayoutRef = useRef(false);
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

			return { nodes: initialNodes, edges: initialEdges };
		}

		// Helper function to calculate positions with fallback to saved positions
		const calculatePosition = (
			nodeId: string,
			index: number,
			level: number = 0,
			offset: number = 0,
			condition?: string
		) => {
			// Check if we have a saved position first
			if (savedPositions[nodeId]) {
				return savedPositions[nodeId];
			}

			// Fallback to calculated position
			const baseX = 250; // Center position
			const baseY = 200;
			const verticalSpacing = 180;
			const horizontalSpacing = 300;

			// Calculate horizontal offset based on condition
			let horizontalOffset = 0;
			if (condition === 'yes') {
				// Position yes condition nodes to the left
				horizontalOffset = -horizontalSpacing;
			} else if (condition === 'no') {
				// Position no condition nodes to the right
				horizontalOffset = horizontalSpacing;
			}
			// Normal nodes stay in center (horizontalOffset = 0)

			return {
				x:
					baseX +
					level * horizontalSpacing +
					offset +
					horizontalOffset,
				y: baseY + index * verticalSpacing,
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
				// No children in this branch - position based on condition
				const horizontalSpacing = 300;
				const verticalOffset = condition === 'yes' ? -40 : 40; // Offset yes above, no below
				const horizontalOffset =
					condition === 'yes'
						? -horizontalSpacing
						: horizontalSpacing;

				return {
					x: parentPos.x + horizontalOffset,
					y: parentPos.y + verticalOffset,
				};
			}

			// Find the bottom-most child position in this branch
			let bottomMostY = 0;
			let bottomMostX = parentPos.x + (condition === 'yes' ? -300 : 300); // Left for yes, right for no

			branchSteps.forEach((step, index) => {
				const stepPos =
					savedPositions[step.id.toString()] ||
					calculatePosition(
						step.id.toString(),
						index,
						level,
						0,
						condition
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
					level,
					0,
					condition || undefined
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
						type: 'straight', // Use straight edge for condition branches
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

					// Only add step node for yes branch if no children OR last child is end_automation
					const lastYesChild =
						yesChildren.length > 0
							? yesChildren[yesChildren.length - 1]
							: null;
					const shouldAddYesStep =
						!lastYesChild || lastYesChild.type === 'end_automation';

					if (shouldAddYesStep) {
						const yesAddId = `add-step-${step.id}-yes`;
						const yesAddPosition =
							savedPositions[yesAddId] ||
							findConditionBranchPosition(
								yesChildren,
								step,
								'yes',
								level + 1
							);

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
							type: 'straight', // Use straight edge for condition to add-step connections
							label,
							style: !lastYesChild
								? {
										stroke: '#52c41a',
										strokeWidth: 2,
									}
								: undefined,
							markerEnd: !lastYesChild
								? {
										type: MarkerType.ArrowClosed,
										color: '#52c41a',
									}
								: undefined,
						});
					}

					// Only add step node for no branch if no children OR last child is end_automation
					const lastNoChild =
						noChildren.length > 0
							? noChildren[noChildren.length - 1]
							: null;
					const shouldAddNoStep =
						!lastNoChild || lastNoChild.type === 'end_automation';

					if (shouldAddNoStep) {
						const noAddId = `add-step-${step.id}-no`;
						const noAddPosition =
							savedPositions[noAddId] ||
							findConditionBranchPosition(
								noChildren,
								step,
								'no',
								level + 1
							);

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
							type: 'straight', // Use straight edge for condition to add-step connections
							label,
							style: !lastNoChild
								? {
										stroke: '#ff4d4f',
										strokeWidth: 2,
									}
								: undefined,
							markerEnd: !lastNoChild
								? {
										type: MarkerType.ArrowClosed,
										color: '#ff4d4f',
									}
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
					y: triggerPos.y + 180,
				};
			} else if (lastRootStep) {
				// Position based on the last root step in the main flow
				const lastRootStepPos =
					savedPositions[lastRootStep.id.toString()] ||
					calculatePosition(
						lastRootStep.id.toString(),
						rootSteps.length - 1,
						0
					);

				finalAddPosition = {
					x: lastRootStepPos.x,
					y: lastRootStepPos.y + 260,
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

	// Layout
	const { layout } = useAutoLayout();
	const [isLoadingLayout, setIsLoadingLayout] = useState(false);

	// Handle layout execution with smart settings for condition nodes
	const handleLayout = async (customOptions?: any) => {
		setIsLoadingLayout(true);
		try {
			// Check if we have condition nodes for optimized spacing
			const hasConditions = nodes.some(
				(node) => node.type === 'condition'
			);

			// Smart layout settings based on workflow complexity
			const smartSettings = hasConditions
				? {
						nodeSpacing: 120, // More space between nodes with conditions
						rankSpacing: 180, // More vertical space for branches
						edgeSpacing: 60, // More edge spacing for cleaner routing
					}
				: {
						nodeSpacing: 100,
						rankSpacing: 150,
						edgeSpacing: 50,
					};

			// Custom smooth layout without aggressive fitView
			await layoutSmooth({
				...smartSettings,
				...customOptions,
			});

			// Save positions after layout completes
			setTimeout(() => {
				setNodes((currentNodes) => {
					savePositionsImmediate(currentNodes, 'layout');
					return currentNodes;
				});
			}, 600); // Wait for layout animation to complete
		} catch (error) {
			console.error('Layout failed:', error);
		} finally {
			setIsLoadingLayout(false);
		}
	};

	// Smooth layout function that doesn't cause jarring zoom changes
	const layoutSmooth = useCallback(
		async (options: any) => {
			const currentNodes = nodesState;
			const currentEdges = edgesState;

			if (currentNodes.length <= 1) {
				return;
			}

			try {
				// Use the layout but prevent aggressive zoom changes
				await layout({
					...options,
					preserveViewport: true, // Custom option we'll handle
				});

				// Only do subtle fitView for new nodes, not aggressive zooming
				requestAnimationFrame(() => {
					// Much gentler viewport adjustment
					// fitView({ padding: 0.2, duration: 300, maxZoom: 1.2 });
				});
			} catch (error) {
				console.error('Smooth layout failed:', error);
				throw error;
			}
		},
		[nodesState, edgesState]
	);

	// Sync ReactFlow state with computed values when they change
	useEffect(() => {
		// Immediately update nodes when the computed nodes change
		setNodes(nodes);
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
		async (nodes: Node[], reason?: string) => {
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
					Math.abs(current.x - new_.x) > 2 || // Slightly increased threshold to reduce API calls
					Math.abs(current.y - new_.y) > 2
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

				console.log(
					`💾 Saving positions (${reason || 'general'}):`,
					positions
				);

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

	// Immediate position saving for layout and structural changes
	const savePositionsImmediate = useCallback(
		(nodes: Node[], reason: string) => {
			saveNodePositions(nodes, reason);
		},
		[saveNodePositions]
	);

	// Debounced position saving to avoid too many API calls for drag operations
	const debouncedSavePositions = useCallback(
		debounce((nodes: Node[], reason?: string) => {
			saveNodePositions(nodes, reason || 'drag');
		}, 300), // Reduced debounce time for more responsive saving
		[saveNodePositions]
	);

	// Handle node changes (including position updates)
	const handleNodesChange = useCallback(
		(changes: any[]) => {
			// Apply changes immediately for responsive UI
			onNodesChange(changes);

			// Check for drag end to save positions
			const hasDragEnd = changes.some(
				(change) =>
					change.type === 'position' && change.dragging === false
			);

			// Track dragging state more precisely
			const isDragStart = changes.some(
				(change) =>
					change.type === 'position' && change.dragging === true
			);

			if (isDragStart) {
				isDraggingRef.current = true;
			}

			if (hasDragEnd) {
				isDraggingRef.current = false;
				// Save positions immediately when drag ends (not during initial load)
				if (!isInitialLoadRef.current) {
					// Get current nodes state for saving
					setTimeout(() => {
						setNodes((currentNodes) => {
							debouncedSavePositions(currentNodes, 'drag-end');
							return currentNodes;
						});
					}, 0);
				}
			}
		},
		[onNodesChange, debouncedSavePositions, setNodes]
	);

	// SMOOTH auto-layout when steps are added (optimized for UX)
	useEffect(() => {
		if (
			steps.length > 0 &&
			automation &&
			!isInitialLoadRef.current &&
			!isLoadingLayout
		) {
			console.log('🚀 Steps changed - triggering SMOOTH auto-layout');

			// Trigger smooth layout with preserved viewport
			const smoothLayoutId = setTimeout(() => {
				if (!isDraggingRef.current && !isLoadingLayout) {
					console.log('⚡ Executing smooth layout for new step');
					setIsLoadingLayout(true);
					layoutSmooth({
						preserveViewport: true, // Prevent jarring zoom changes
					})
						.then(() => {
							// Save positions after smooth layout
							setTimeout(() => {
								setNodes((currentNodes) => {
									savePositionsImmediate(
										currentNodes,
										'smooth-step-layout'
									);
									return currentNodes;
								});
								setIsLoadingLayout(false);
							}, 400); // Shorter wait for smoother experience
						})
						.catch((error) => {
							console.error('Smooth layout failed:', error);
							setIsLoadingLayout(false);
						});
				}
			}, 100); // Slight delay for smoother experience

			return () => clearTimeout(smoothLayoutId);
		}
	}, [steps.length, automation?.id]); // Only depend on steps length and automation ID, not the entire objects

	// Save positions when nodes structure changes (fallback)
	useEffect(() => {
		if (
			nodes.length > 0 &&
			automation &&
			!isInitialLoadRef.current &&
			!isLoadingLayout
		) {
			// Immediate save for structure changes to ensure positions are persisted
			const timeoutId = setTimeout(() => {
				if (!isLoadingLayout) {
					savePositionsImmediate(nodes, 'structure-change');
				}
			}, 200); // Short delay to allow nodes to settle

			return () => clearTimeout(timeoutId);
		}
	}, [nodes.length, automation?.id]); // Only depend on length and automation ID

	// Initial layout on first load - only if no saved positions exist
	useEffect(() => {
		if (nodes.length > 1 && isInitialLoadRef.current) {
			const savedPositions =
				automation?.settings?.reactflow_positions || {};

			// Check if we have saved positions for actual workflow nodes (not just add-step nodes)
			const workflowNodeIds = nodes
				.filter((node) => !node.id.startsWith('add-step'))
				.map((node) => node.id);
			const hasSavedPositions = workflowNodeIds.some(
				(nodeId) => savedPositions[nodeId]
			);

			const timeoutId = setTimeout(() => {
				if (isInitialLoadRef.current) {
					if (!hasSavedPositions) {
						console.log(
							'Applying initial layout for',
							nodes.length,
							'nodes (no saved positions found)'
						);
						handleLayout().then(() => {
							// Save positions after initial layout
							setTimeout(() => {
								setNodes((currentNodes) => {
									savePositionsImmediate(
										currentNodes,
										'initial-layout'
									);
									return currentNodes;
								});
							}, 700);
						});
					} else {
						console.log(
							'Skipping initial layout - using saved positions for',
							nodes.length,
							'nodes'
						);
					}
					isInitialLoadRef.current = false;
				}
			}, 500); // Give time for nodes to render

			return () => clearTimeout(timeoutId);
		}
	}, [
		nodes.length,
		handleLayout,
		savePositionsImmediate,
		setNodes,
		automation?.settings?.reactflow_positions,
	]);

	// Track node count changes and trigger auto-layout when nodes are added/deleted
	useEffect(() => {
		const currentNodeCount = nodes.length;
		const prevNodeCount = prevNodeCountRef.current;

		// Skip if this is the initial load or first time setting the count
		if (isInitialLoadRef.current || prevNodeCount === 0) {
			prevNodeCountRef.current = currentNodeCount;
			return;
		}

		// Only trigger layout if node count actually changed and we're not dragging and not already loading
		if (
			currentNodeCount !== prevNodeCount &&
			!isDraggingRef.current &&
			!isLoadingLayout
		) {
			console.log(
				'🔄 Node count changed - triggering gentle secondary layout'
			);
			shouldTriggerLayoutRef.current = true;

			const timeoutId = setTimeout(() => {
				if (shouldTriggerLayoutRef.current && !isLoadingLayout) {
					setIsLoadingLayout(true);
					// Use smooth layout for secondary trigger too
					layoutSmooth({
						preserveViewport: true, // Keep viewport stable
					})
						.then(() => {
							// Save after smooth secondary layout
							setTimeout(() => {
								setNodes((currentNodes) => {
									savePositionsImmediate(
										currentNodes,
										'gentle-secondary-layout'
									);
									return currentNodes;
								});
								setIsLoadingLayout(false);
							}, 400); // Shorter wait time
						})
						.catch((error) => {
							console.error(
								'Secondary smooth layout failed:',
								error
							);
							setIsLoadingLayout(false);
						});
					shouldTriggerLayoutRef.current = false;
				}
			}, 200); // Longer delay to avoid conflicts with primary layout

			return () => clearTimeout(timeoutId);
		}

		prevNodeCountRef.current = currentNodeCount;
	}, [nodes.length]); // Only depend on nodes length to avoid circular dependencies

	if (isLoading) {
		return (
			<div className="qcrm-reactflow-loading">
				{__('Loading workflow...', 'quillcrm')}
			</div>
		);
	}

	// Debug logging
	console.log('ReactFlow nodes:', nodesState.length, nodesState);
	console.log('ReactFlow edges:', edgesState.length, edgesState);

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
						defaultEdgeOptions={{
							type: 'straight',
							style: { strokeWidth: 2 },
							markerEnd: { type: MarkerType.ArrowClosed },
						}}
						fitView
						fitViewOptions={{ padding: 0.2 }}
						nodesDraggable={false}
						nodesConnectable={false}
						elementsSelectable={true}
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
