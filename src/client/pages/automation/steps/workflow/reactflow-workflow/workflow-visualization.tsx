/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

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
	Panel,
	useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StickyNote } from 'lucide-react';
import {
	DndContext,
	DragOverlay,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Automation, AutomationStep, CanvasNote } from '@doublescale/client';
import { useAutomationContext } from '../../../state/context';
import { Button } from '@/components/ui/button';
import {
	createCanvasNote,
	getCanvasNotes,
	saveCanvasNotes,
} from './utils/canvas-notes-utils';

// Configuration constants
import {
	LAYOUT_CONSTANTS,
	EDGE_STYLES,
	LAYOUT_CONSTANTS_VIEW_MODE,
} from './config';

// Types and Interfaces
import { WorkflowVisualizationProps, NODE_TYPES, EDGE_TYPES } from './types';

// Helper functions
import { getNodePosition, calculatePositions } from './utils/position-utils';
import { removeDuplicateEdges } from './utils/edge-utils';
import { deleteStep } from './utils/step-utils';
import {
	isDescendantOf,
	moveStep,
	moveStepToContext,
} from './utils/step-reorder-utils';
import { WorkflowReorderContext } from './components/workflow-reorder-context';
import StepDragOverlay from './components/step-drag-overlay';

// NodeProcess component
import { initializeTrigger, addFinalAddStep } from './utils/node-process';
import { getNodeAnalyticsForId } from './utils/analytics-utils';

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
	currentStep,
	isTriggerVisible,
	viewMode = false,
	analyticsData = [],
	onStepClick,
	onClearStep,
	onTriggerClick,
}) => {
	// ========== CONTEXT AND STATE ==========
	const { updateAutomation, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('doublescale/core');
	const reactFlowInstance = useReactFlow();

	// Track the last focused step ID when a step or trigger is selected
	const lastFocusedStepIdRef = useRef<string | null>(null);
	// Track previous step state to detect when modal closes
	const prevStepStateRef = useRef<{
		id: number | null;
		action: string | null;
		type: string | null;
	}>({
		id: null,
		action: null,
		type: null,
	});
	const initialViewportSetRef = useRef(false);
	const [activeDragStep, setActiveDragStep] = useState<AutomationStep | null>(
		null
	);

	const clearPositions = useCallback(() => {
		if (!automation) {
			return;
		}

		const updatedAutomation = {
			...automation,
			settings: {
				...automation.settings,
				reactflow_positions: {},
			},
		};

		updateAutomation(updatedAutomation);

		apiFetch({
			path: `/doublescale/v1/automations/${automation.id}`,
			method: 'POST',
			data: updatedAutomation,
		}).catch((error) => {
			console.error('Failed to clear node positions:', error);
		});
	}, [automation, updateAutomation]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		})
	);

	const sortableStepIds = useMemo(() => {
		if (viewMode) {
			return [];
		}

		return steps.map((step) => step.id.toString());
	}, [steps, viewMode]);

	const savedPositionsKey = useMemo(
		() =>
			JSON.stringify(automation?.settings?.reactflow_positions ?? {}),
		[automation?.settings?.reactflow_positions]
	);

	const canvasNotesLayoutKey = useMemo(
		() =>
			JSON.stringify(
				(automation?.settings?.canvas_notes ?? []).map((note: CanvasNote) => ({
					id: note.id,
					position: note.position,
					color: note.color,
				}))
			),
		[automation?.settings?.canvas_notes]
	);

	const handleNoteUpdate = useCallback(
		async (noteId: string, content: string) => {
			if (!automation) {
				return;
			}

			const notes = getCanvasNotes(automation);
			const updatedNotes = notes.map((note) =>
				note.id === noteId ? { ...note, content } : note
			);

			try {
				await saveCanvasNotes(automation, updatedNotes, updateAutomation);
			} catch (error) {
				console.error('Failed to save canvas note:', error);
			}
		},
		[automation, updateAutomation]
	);

	const handleNoteDelete = useCallback(
		async (noteId: string) => {
			if (!automation) {
				return;
			}

			const updatedNotes = getCanvasNotes(automation).filter(
				(note) => note.id !== noteId
			);

			try {
				await saveCanvasNotes(automation, updatedNotes, updateAutomation);
			} catch (error) {
				console.error('Failed to delete canvas note:', error);
			}
		},
		[automation, updateAutomation]
	);

	const handleAddNote = useCallback(() => {
		if (!automation || !reactFlowInstance) {
			return;
		}

		const canvasEl = document.querySelector(
			'.doublescale-reactflow-workflow__canvas'
		);
		const bounds = canvasEl?.getBoundingClientRect();

		if (!bounds) {
			return;
		}

		const position = reactFlowInstance.screenToFlowPosition({
			x: bounds.left + bounds.width / 2 - 110,
			y: bounds.top + bounds.height / 2 - 80,
		});

		const newNote = createCanvasNote(position);

		void saveCanvasNotes(
			automation,
			[...getCanvasNotes(automation), newNote],
			updateAutomation
		);
	}, [automation, reactFlowInstance, updateAutomation]);

	const handleDragStart = useCallback(
		(event: DragStartEvent) => {
			if (viewMode) {
				return;
			}

			const step = steps.find(
				(s) => s.id.toString() === event.active.id.toString()
			);
			setActiveDragStep(step ?? null);
		},
		[viewMode, steps]
	);

	const handleDragCancel = useCallback(() => {
		setActiveDragStep(null);
	}, []);

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			setActiveDragStep(null);

			if (viewMode) {
				return;
			}

			const { active, over } = event;
			if (!over || active.id === over.id) {
				return;
			}

			const activeStep = steps.find(
				(s) => s.id.toString() === active.id.toString()
			);

			if (!activeStep) {
				return;
			}

			const overId = over.id.toString();

			if (overId.startsWith('add-step')) {
				const dropData = over.data.current as
					| {
							parentId?: number | null;
							condition?: string | null;
					  }
					| undefined;
				const targetParentId = dropData?.parentId || 0;
				const targetCondition = targetParentId
					? dropData?.condition || ''
					: '';

				if (
					targetParentId === activeStep.id ||
					(targetParentId &&
						isDescendantOf(steps, activeStep.id, targetParentId))
				) {
					return;
				}

				await moveStepToContext(
					activeStep,
					targetParentId,
					targetCondition,
					steps,
					setSteps,
					createNotice,
					clearPositions
				);
				return;
			}

			const overStep = steps.find(
				(s) => s.id.toString() === overId
			);

			if (!overStep) {
				return;
			}

			if (isDescendantOf(steps, activeStep.id, overStep.id)) {
				return;
			}

			await moveStep(
				activeStep,
				overStep.id,
				steps,
				setSteps,
				createNotice,
				clearPositions
			);
		},
		[viewMode, steps, setSteps, createNotice, clearPositions]
	);

	const reorderContextValue = useMemo(
		() => ({
			clearPositions,
			isDragging: activeDragStep !== null,
			activeDragStepId: activeDragStep?.id?.toString() ?? null,
		}),
		[clearPositions, activeDragStep]
	);

	const focusViewportOnTrigger = useCallback(
		(duration = 0) => {
			const trigger = reactFlowInstance?.getNode('trigger');
			if (!trigger || !reactFlowInstance) {
				return;
			}

			const canvasEl = document.querySelector(
				'.doublescale-reactflow-workflow__canvas'
			);
			const canvasWidth =
				canvasEl?.getBoundingClientRect().width ?? 800;
			const zoom = 1;
			const topGap = LAYOUT_CONSTANTS.VIEWPORT_TOP_GAP;
			const nodeCenterX =
				trigger.position.x + LAYOUT_CONSTANTS.NODE_WIDTH / 2;

			// Pin trigger near top of canvas — fitView centers one node and leaves a huge gap
			const x = canvasWidth / 2 - nodeCenterX * zoom;
			const y = topGap - trigger.position.y * zoom;

			void reactFlowInstance.setViewport({ x, y, zoom }, { duration });
		},
		[reactFlowInstance]
	);

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
					path: `/doublescale/v1/automation-steps/${stepId}`,
					method: 'DELETE',
					data: {
						updated_steps: {},
					},
				});

				// Refresh the automation data after deletion
				const updatedAutomation = (await apiFetch({
					path: `/doublescale/v1/automations/${automation.id}`,
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
			savedPositions,
			isTriggerVisible,
			viewMode,
			analyticsData
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
		const selectedStepId = currentStep?.id?.toString() || null;
		const result = processStepHierarchy(
			steps,
			initialNodes,
			initialEdges,
			automation!,
			onStepClick,
			onClearStep,
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
			0,
			selectedStepId,
			viewMode,
			analyticsData
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

		const canvasNotes = getCanvasNotes(automation);
		canvasNotes.forEach((note) => {
			initialNodes.push({
				id: `sticky-note-${note.id}`,
				type: 'sticky_note',
				position: note.position,
				draggable: !viewMode,
				selectable: !viewMode,
				zIndex: 5,
				data: {
					note,
					viewMode,
					onUpdate: handleNoteUpdate,
					onDelete: handleNoteDelete,
				},
			});
		});

		setNodes(initialNodes);
		setEdges(initialEdges);

		// saveNodePositions(initialNodes);
	}, [
		automation?.id,
		savedPositionsKey,
		canvasNotesLayoutKey,
		steps,
		onStepClick,
		onClearStep,
		onDeleteStep,
		currentStep?.id,
		isTriggerVisible,
		viewMode,
		analyticsData,
		handleNoteUpdate,
		handleNoteDelete,
	]);

	// Patch sticky note content without rebuilding the full workflow layout.
	useEffect(() => {
		const notes = getCanvasNotes(automation);
		if (!notes.length) {
			return;
		}

		setNodes((currentNodes) => {
			let changed = false;

			const nextNodes = currentNodes.map((node) => {
				if (!node.id.startsWith('sticky-note-')) {
					return node;
				}

				const noteId = node.id.replace('sticky-note-', '');
				const note = notes.find((item) => item.id === noteId);
				if (!note) {
					return node;
				}

				const existingNote = (node.data as { note?: CanvasNote })?.note;
				if (
					existingNote?.content === note.content &&
					existingNote?.color === note.color
				) {
					return node;
				}

				changed = true;
				return {
					...node,
					data: {
						...node.data,
						note,
					},
				};
			});

			return changed ? nextNodes : currentNodes;
		});
	}, [automation?.settings?.canvas_notes, setNodes]);
	// Patch analytics onto existing nodes whenever report data changes in view mode.
	useEffect(() => {
		if (!viewMode || !analyticsData.length) {
			return;
		}

		setNodes((currentNodes) => {
			let changed = false;

			const nextNodes = currentNodes.map((node) => {
				const analytics = getNodeAnalyticsForId(node.id, analyticsData);
				if (!analytics || !node.data) {
					return node;
				}

				const existing = (node.data as { analytics?: { contacts?: number; conversion_rate?: number } }).analytics;
				if (
					existing?.contacts === analytics.contacts &&
					existing?.conversion_rate === analytics.conversion_rate
				) {
					return node;
				}

				changed = true;
				return {
					...node,
					data: {
						...node.data,
						analytics,
					},
				};
			});

			return changed ? nextNodes : currentNodes;
		});
	}, [analyticsData, viewMode, setNodes]);

	useEffect(() => {
		initialViewportSetRef.current = false;
	}, [automation?.id]);

	// After refresh: anchor on trigger with gap below tabs (not full-workflow fitView)
	useEffect(() => {
		if (!reactFlowInstance || nodesState.length === 0) {
			return undefined;
		}
		if (initialViewportSetRef.current || isTriggerVisible || currentStep?.id) {
			return undefined;
		}

		const timer = setTimeout(() => {
			focusViewportOnTrigger(0);
			initialViewportSetRef.current = true;
		}, 50);

		const retry = setTimeout(() => {
			if (!initialViewportSetRef.current) {
				focusViewportOnTrigger(0);
				initialViewportSetRef.current = true;
			}
		}, 300);

		return () => {
			clearTimeout(timer);
			clearTimeout(retry);
		};
	}, [
		automation?.id,
		nodesState.length,
		reactFlowInstance,
		focusViewportOnTrigger,
		isTriggerVisible,
		currentStep?.id,
	]);

	// Focus on selected node when currentStep changes or trigger is selected
	useEffect(() => {
		if (!reactFlowInstance) return;

		if (isTriggerVisible) {
			// Focus on trigger node
			lastFocusedStepIdRef.current = 'trigger';
			const timer = setTimeout(() => {
				const node = reactFlowInstance.getNode('trigger');

				if (node) {
					focusViewportOnTrigger(400);
				}
			}, 100); // Small delay to ensure nodes are updated

			return () => clearTimeout(timer);
		} else if (currentStep?.id) {
			const prevState = prevStepStateRef.current;
			const nodeId = currentStep.id.toString();

			// Detect different scenarios
			const isNewStep = prevState.id !== currentStep.id;
			const modalJustClosed =
				prevState.id === currentStep.id &&
				(currentStep.type === 'action' ||
					currentStep.type === 'goal') &&
				prevState.action === null &&
				currentStep.action !== null;

			// Steps that open sidebar directly (not a standalone modal)
			const opensSidebarDirectly =
				currentStep.type === 'condition' ||
				currentStep.type === 'delay' ||
				currentStep.type === 'end_automation' ||
				(currentStep.type === 'action' && currentStep.action) || // Configured actions
				(currentStep.type === 'goal' && currentStep.action); // Configured goals

			// Update tracking refs
			lastFocusedStepIdRef.current = nodeId;
			prevStepStateRef.current = {
				id: currentStep.id,
				action: currentStep.action || null,
				type: currentStep.type || null,
			};

			// Focus when:
			// 1. Modal just closed with action selection
			// 2. It's a step that opens sidebar directly
			// 3. Clicking on a different step
			const shouldFocus =
				modalJustClosed || // Action/Goal modal just closed with selection
				opensSidebarDirectly || // Steps that show sidebar directly
				isNewStep; // Any time a different step is clicked

			if (shouldFocus) {
				// Delay to ensure nodes are rendered
				const timer = setTimeout(() => {
					const node = reactFlowInstance.getNode(nodeId);

					if (node) {
						// Center the view on the selected node with animation
						reactFlowInstance.fitView({
							nodes: [{ id: nodeId }],
							duration: 400,
							padding: 0.5,
							minZoom: 0.8,
							maxZoom: 1.2,
						});
					}
				}, 100); // Small delay to ensure nodes are updated

				return () => clearTimeout(timer);
			}

			return undefined;
		}

		return undefined;
	}, [
		currentStep?.id,
		currentStep?.action,
		currentStep?.type,
		isTriggerVisible,
		reactFlowInstance,
		nodesState,
		focusViewportOnTrigger,
	]);

	// ========== POSITION MANAGEMENT ==========

	// Save node positions when they change
	const saveNodePositions = async (nodes: Node[]) => {
		if (!automation) return;

		const positions: Record<string, { x: number; y: number }> = {};
		nodes.forEach((node) => {
			positions[node.id] = node.position;
		});

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
				path: `/doublescale/v1/automations/${automation.id}`,
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
		(event, node) => {
			const target = event.target as HTMLElement | null;
			// Nested confirm/rename dialogs have their own layer. The editor
			// itself also lives in a dialog layer — matching every layer would
			// swallow every canvas click and never open step settings.
			if (
				target?.closest(
					'[data-doublescale-dialog-layer]:not(:has(#doublescale-automation-editor-dialog))'
				)
			) {
				return;
			}

			if (node.id === 'trigger' && onTriggerClick) {
				onTriggerClick();
			} else if (
				node.id !== 'trigger' &&
				!node.id.startsWith('add-step') &&
				!node.id.startsWith('sticky-note-') &&
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

	const onNodeDragStop = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			if (!node.id.startsWith('sticky-note-') || !automation) {
				return;
			}

			const noteId = node.id.replace('sticky-note-', '');
			const updatedNotes = getCanvasNotes(automation).map((note) =>
				note.id === noteId ? { ...note, position: node.position } : note
			);

			void saveCanvasNotes(automation, updatedNotes, updateAutomation);
		},
		[automation, updateAutomation]
	);

	// ========== RENDER LOGIC ==========

	if (isLoading) {
		return (
			<div className="doublescale-reactflow-loading">
				{__('Loading workflow...', 'doublescale')}
			</div>
		);
	}

	return (
		<WorkflowReorderContext.Provider value={reorderContextValue}>
			<div
				className={`doublescale-reactflow-workflow${viewMode ? ' doublescale-reactflow-workflow--view-mode' : ''}${activeDragStep ? ' doublescale-reactflow-workflow--reordering' : ''}`}
			>
				<div className="doublescale-reactflow-workflow__layout">
					<div className="doublescale-reactflow-workflow__canvas">
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragStart={handleDragStart}
							onDragCancel={handleDragCancel}
							onDragEnd={handleDragEnd}
						>
							<SortableContext items={sortableStepIds}>
								<ReactFlow
						nodes={nodesState}
						edges={edgesState}
						onNodesChange={handleNodesChange}
						onEdgesChange={onEdgesChange}
						onNodeClick={viewMode ? undefined : onNodeClick}
						onNodeDragStop={viewMode ? undefined : onNodeDragStop}
						nodeTypes={NODE_TYPES}
						edgeTypes={EDGE_TYPES}
						nodesConnectable={false}
						elementsSelectable={!viewMode}
						nodesDraggable={false}
						selectNodesOnDrag={false}
						panOnDrag={true}
						zoomOnScroll={true}
						zoomOnPinch={true}
						zoomOnDoubleClick={!viewMode}
						deleteKeyCode={null}
						defaultEdgeOptions={{
							animated: false,
							type: 'straightEdge',
							style: EDGE_STYLES.DEFAULT,
						}}
						elevateEdgesOnSelect={!viewMode}
						elevateNodesOnSelect={false}
						snapToGrid={false}
						snapGrid={[15, 15]}
						edgesFocusable={false}
						edgesReconnectable={false}
						noPanClassName="nopan"
						noDragClassName="nodrag"
					>
						<Background />
						<Controls />
						{!viewMode && (
							<Panel position="top-right" className="doublescale-reactflow-workflow__notes-panel">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="bg-white shadow-sm"
									onClick={handleAddNote}
								>
									<StickyNote className="mr-2 h-4 w-4" />
									{__('Add note', 'doublescale')}
								</Button>
							</Panel>
						)}

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
										case 'sticky_note':
											return '#fbbf24';
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
							</SortableContext>
							<DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
								{activeDragStep ? (
									<StepDragOverlay step={activeDragStep} />
								) : null}
							</DragOverlay>
						</DndContext>
					</div>
				</div>
			</div>
		</WorkflowReorderContext.Provider>
	);
};

export default WorkflowVisualization;
