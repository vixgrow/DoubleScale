/**
 * External dependencies
 */
import { EdgeTypes } from '@xyflow/react';
/**
 * Internal dependencies
 */
import {
	Automation,
	AutomationStep,
	OrganizedStep,
} from '../../../../../../types';
import AddStepEdge from '../edges/add-step-edge';
import ConditionEdge from '../edges/condition-edge';
import StraightEdge from '../edges/straight-edge';
import ActionNode from '../nodes/action-node';
import AddStepNode from '../nodes/add-step-node';
import BranchNode from '../nodes/branch-node';
import ConditionNode from '../nodes/condition-node';
import DelayNode from '../nodes/delay-node';
import EndNode from '../nodes/end-node';
import GoalNode from '../nodes/goal-node';
import MergeNode from '../nodes/merge-node';
import TriggerNode from '../nodes/trigger-node';
import StickyNoteNode from '../nodes/sticky-note-node';

/**
 * Types and Interfaces
 */
interface WorkflowVisualizationProps {
	automation?: Automation;
	steps?: AutomationStep[];
	isLoading?: boolean;
	currentStep?: OrganizedStep | null;
	isTriggerVisible?: boolean;
	isSidebarOpen?: boolean;
	viewMode?: boolean;
	analyticsData?: any[];
	onStepClick?: (step: OrganizedStep) => void;
	onClearStep?: () => void;
	onTriggerClick?: () => void;
}

interface PositionCalculationParams {
	stepList: AutomationStep[];
	parentId: number | null;
	condition: string | null;
	level: number;
	startX: number;
	startY: number;
}

/**
 * Node and Edge type registrations
 */
const NODE_TYPES = {
	trigger: TriggerNode,
	action: ActionNode,
	condition: ConditionNode,
	delay: DelayNode,
	goal: GoalNode,
	end_automation: EndNode,
	add_step: AddStepNode,
	merge: MergeNode,
	branch: BranchNode,
	sticky_note: StickyNoteNode,
};

const EDGE_TYPES: EdgeTypes = {
	addStepEdge: AddStepEdge,
	conditionEdge: ConditionEdge,
	straightEdge: StraightEdge,
};

export type { WorkflowVisualizationProps, PositionCalculationParams };
export { NODE_TYPES, EDGE_TYPES };
