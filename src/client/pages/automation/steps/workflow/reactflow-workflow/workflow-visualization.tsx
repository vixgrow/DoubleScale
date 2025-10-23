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
	NodeMouseHandler,
	Background,
	Controls,
	MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Automation, AutomationStep } from '@quillcrm/client';
import { useAutomationContext } from '../../../state/context';

// Configuration constants
import { LAYOUT_CONSTANTS, EDGE_STYLES } from './config';

// Types and Interfaces
import { WorkflowVisualizationProps, NODE_TYPES, EDGE_TYPES } from './types';

// Helper functions
import { getNodePosition, calculatePositions } from './utils/position-utils';
import { removeDuplicateEdges } from './utils/edge-utils';
import { deleteStep } from './utils/step-utils';

// NodeProcess component
import { initializeTrigger, addFinalAddStep } from './utils/node-process';

// StepHierarchy component
import { processStepHierarchy } from './utils/step-hierarchy';

// Connection utilities
import {
	connectChildMergesToParentMerges,
	connectChildMergesToSubsequentSteps,
	connectLastStepsToParentMerge,
	connectMergesToSubsequentSteps,
	connectFinalMergeToSubsequentSteps,
} from './utils/merge-connection-utils';

/**
 * Main Component
 */
const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
	automation,
	steps = [],
	isLoading = false,
	onStepClick,
	onTriggerClick,
}) => {
	// ========== CONTEXT AND STATE ==========
	const { updateAutomation } = useAutomationContext();

	// ReactFlow state management
	const [nodesState, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edgesState, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	// ========== AUTOMATION OPERATIONS ==========

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

				// Make API call to delete the step using the correct endpoint
				await apiFetch({
					path: `/qc/v1/automation-steps/${stepId}`,
					method: 'DELETE',
					data: {
						updated_steps: {},
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

	// ========== MAIN LAYOUT EFFECT ==========
	useEffect(() => {
		const initialNodes: Node[] = [];
		const initialEdges: Edge[] = [];
		// the width of node
		const nodeWidth = LAYOUT_CONSTANTS.NODE_WIDTH;
		// the width of the add step node
		const addStepWidth = LAYOUT_CONSTANTS.ADD_STEP_WIDTH;
		// the width of the yes and no nodes
		const nodeYesNoWidth = LAYOUT_CONSTANTS.NODE_YES_NO_WIDTH;
		// start X position of the nodes
		const startX = LAYOUT_CONSTANTS.START_X;
		// start Trigger node Y position
		const startY = LAYOUT_CONSTANTS.START_Y;
		// The distance between nodes
		const incrementY = LAYOUT_CONSTANTS.INCREMENT_Y;

		// Get saved positions from automation settings
		const savedPositions = automation?.settings?.reactflow_positions || {};

		// Initialize trigger node
		initializeTrigger(
			automation,
			steps,
			setNodes,
			setEdges,
			initialNodes,
			initialEdges,
			startX,
			startY,
			incrementY,
			nodeWidth,
			addStepWidth,
			onTriggerClick,
			onStepClick,
			savedPositions
		);

		// Position calculator that considers nested structure
		const positionMap = new Map<string, { x: number; y: number }>();

		// Helper function to get saved position or calculated position
		const getNodePositionLocal = (
			nodeId: string,
			fallbackX = startX,
			fallbackY = startY,
			step?: AutomationStep,
			stepIndex?: number
		) => {
			return getNodePosition(
				nodeId,
				savedPositions,
				positionMap,
				steps,
				fallbackX,
				fallbackY,
				step,
				stepIndex
			);
		};

		// Calculate all positions first for the root steps
		calculatePositions(
			{
				stepList: steps,
				parentId: null,
				condition: null,
				level: 0,
				startX,
				startY,
			},
			positionMap
		);

		// Process the entire step hierarchy starting from root
		const result = processStepHierarchy(
			steps,
			initialNodes,
			initialEdges,
			automation!,
			onStepClick,
			onDeleteStep,
			getNodePositionLocal as (
				nodeId: string,
				fallbackX?: number,
				fallbackY?: number,
				step?: AutomationStep,
				stepIndex?: number
			) => { x: number; y: number },
			startX,
			startY,
			nodeWidth,
			nodeYesNoWidth,
			addStepWidth,
			savedPositions,
			null,
			null,
			0,
			0
		);

		// Post-process to ensure all child condition merge nodes connect to their parent merge nodes
		connectChildMergesToParentMerges(steps, initialNodes, initialEdges);

		// Connect child merge nodes to subsequent steps in the same branch
		connectChildMergesToSubsequentSteps(steps, initialNodes, initialEdges);

		// Connect the last step in each branch to the parent merge node
		connectLastStepsToParentMerge(steps, initialNodes, initialEdges);

		// Connect merge nodes to subsequent steps after all merge hierarchies are established
		connectMergesToSubsequentSteps(steps, initialNodes, initialEdges);

		// Final pass: Connect the appropriate merge nodes to subsequent root-level steps
		connectFinalMergeToSubsequentSteps(steps, initialNodes, initialEdges);

		// Remove duplicate edges
		const uniqueEdges = removeDuplicateEdges(initialEdges);
		initialEdges.length = 0;
		initialEdges.push(...uniqueEdges);

		// Add final add-step node for root level if needed
		addFinalAddStep(
			steps,
			initialNodes,
			initialEdges,
			startX,
			startY,
			incrementY,
			nodeWidth,
			addStepWidth,
			onStepClick,
			savedPositions,
			getNodePositionLocal,
			result
		);

		setNodes(initialNodes);
		setEdges(initialEdges);

		// saveNodePositions(initialNodes);
	}, [automation?.id, steps, onStepClick, onDeleteStep]);

	// ========== POSITION MANAGEMENT ==========

	// Save node positions when they change
	const saveNodePositions = async (nodes: Node[]) => {
		if (!automation) return;

		const positions: Record<string, { x: number; y: number }> = {};
		nodes.forEach((node) => {
			positions[node.id] = node.position;
		});

		console.log('Positions:', positions);
		console.log('Nodes:', nodes);
		console.log('Positions Length:', Object.keys(positions).length);
		console.log('Nodes Length:', nodes.length);

		// Check if positions have actually changed to avoid unnecessary saves
		const currentPositions = automation.settings?.reactflow_positions || {};

		// Use 'some()' instead of 'every()' to detect if ANY position has changed
		const hasChanges = Object.keys(positions).some((nodeId) => {
			const current = currentPositions[nodeId];
			const new_ = positions[nodeId];
			return (
				!current ||
				Math.abs(current.x - new_.x) >
					LAYOUT_CONSTANTS.POSITION_THRESHOLD ||
				Math.abs(current.y - new_.y) >
					LAYOUT_CONSTANTS.POSITION_THRESHOLD
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
	};

	// ========== EVENT HANDLERS ==========

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

	// ========== RENDER LOGIC ==========

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
						nodeTypes={NODE_TYPES}
						edgeTypes={EDGE_TYPES}
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
							style: EDGE_STYLES.DEFAULT,
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
									height: LAYOUT_CONSTANTS.MINIMAP_HEIGHT,
									width: LAYOUT_CONSTANTS.MINIMAP_WIDTH,
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
