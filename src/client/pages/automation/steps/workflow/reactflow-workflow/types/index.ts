import { EdgeTypes } from '@xyflow/react';
import {
	Automation,
	AutomationStep,
	OrganizedStep,
} from '../../../../../../types';
import AddStepEdge from '../edges/add-step-edge';
import ConditionEdge from '../edges/condition-edge';
import ActionNode from '../nodes/action-node';
import AddStepNode from '../nodes/add-step-node';
import BranchNode from '../nodes/branch-node';
import ConditionNode from '../nodes/condition-node';
import DelayNode from '../nodes/delay-node';
import EndNode from '../nodes/end-node';
import GoalNode from '../nodes/goal-node';
import MergeNode from '../nodes/merge-node';
import TriggerNode from '../nodes/trigger-node';

/**
 * Types and Interfaces
 */
interface WorkflowVisualizationProps {
    automation?: Automation;
    steps?: AutomationStep[];
    isLoading?: boolean;
    onStepClick?: (step: OrganizedStep) => void;
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
};

const EDGE_TYPES: EdgeTypes = {
    addStepEdge: AddStepEdge,
    conditionEdge: ConditionEdge,
};

export type { WorkflowVisualizationProps, PositionCalculationParams };
export { NODE_TYPES, EDGE_TYPES };