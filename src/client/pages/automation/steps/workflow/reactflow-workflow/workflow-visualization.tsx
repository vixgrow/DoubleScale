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
	// const isInitialLoadRef = useRef(true);
	// Track previous node count to detect additions/deletions
	// const prevNodeCountRef = useRef(0);
	// Create nodes and edges from steps with proper hierarchical handling

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

		// Helper function to get saved position or default fallback
		const getNodePosition = (
			nodeId: string,
			fallbackX = 250,
			fallbackY = 200
		) => {
			return savedPositions[nodeId] || { x: fallbackX, y: fallbackY };
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
				const position = getNodePosition(step.id.toString());

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

					// Always add step node for yes branch unless last child is end_automation or condition
					const lastYesChild =
						yesChildren.length > 0
							? yesChildren[yesChildren.length - 1]
							: null;
					const shouldAddYesStep =
						!lastYesChild ||
						(lastYesChild.type !== 'end_automation' &&
							lastYesChild.type !== 'condition');

					if (shouldAddYesStep) {
						const yesAddId = `add-step-${step.id}-yes`;
						const yesAddPosition = getNodePosition(yesAddId);

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
								? {
										type: MarkerType.ArrowClosed,
										color: '#52c41a',
									}
								: undefined,
						});
					}

					// Always add step node for no branch unless last child is end_automation or condition
					const lastNoChild =
						noChildren.length > 0
							? noChildren[noChildren.length - 1]
							: null;
					const shouldAddNoStep =
						!lastNoChild ||
						(lastNoChild.type !== 'end_automation' &&
							lastNoChild.type !== 'condition');

					if (shouldAddNoStep) {
						const noAddId = `add-step-${step.id}-no`;
						const noAddPosition = getNodePosition(noAddId);

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
				const lastRootStepPos = getNodePosition(
					lastRootStep.id.toString()
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

		// Apply auto-layout before setting nodes if no saved positions exist
		const applyLayoutAndSetNodes = async () => {
			// Check if we have any saved positions for step nodes (excluding trigger)
			const hasExistingPositions = steps.some(
				(step) => savedPositions[step.id.toString()]
			);

			console.log('hasExistingPositions', hasExistingPositions);
			console.log('steps', steps.length);
			console.log('initialNodes', initialNodes.length);

			// Only auto-layout if there are no existing saved positions and we have steps
			if (
				!hasExistingPositions &&
				steps.length > 0 &&
				initialNodes.length > 1
			) {
				try {
					// Apply layout to get better positioned nodes
					const layoutResult = await useAutoLayout(
						[...initialNodes],
						[...initialEdges]
					);

					console.log('layoutResult', layoutResult);

					if (layoutResult) {
						setNodes(layoutResult.nodes);
						setEdges(layoutResult.edges);
						// Save the new positions immediately
						// saveNodePositions(layoutResult.nodes, 'initial_layout');
						return;
					}
				} catch (error) {
					console.error('Failed to apply initial layout:', error);
				}
			}

			// Fallback: set nodes without layout
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
					Math.abs(current.x - new_.x) > 2 || // Threshold to reduce API calls
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
