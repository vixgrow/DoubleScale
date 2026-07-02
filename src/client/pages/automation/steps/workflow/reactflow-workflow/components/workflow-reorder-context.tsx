/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const WorkflowReorderContext = createContext<{
	clearPositions?: () => void;
	isDragging?: boolean;
	activeDragStepId?: string | null;
}>({});

export const useWorkflowReorder = () => useContext(WorkflowReorderContext);
