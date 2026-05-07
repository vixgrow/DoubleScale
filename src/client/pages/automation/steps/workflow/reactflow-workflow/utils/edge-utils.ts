/**
 * External dependencies
 */
import { Edge, Node } from '@xyflow/react';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@doublescale/client';

/**
 * Edge types
 */
export enum EdgeType {
    DEFAULT = 'default',
    CONDITION = 'conditionEdge',
    ADD_STEP = 'addStepEdge'
}

/**
 * Edge style options
 */
export const EDGE_STYLES = {
    DEFAULT: {
        stroke: '#D7D7DA',
        strokeWidth: 2,
    },
    CONDITION: {
        stroke: '#D7D7DA',
        strokeWidth: 3,
    }
};

/**
 * Check if a node exists in the nodes array
 * 
 * @param nodes Array of nodes
 * @param nodeId ID of the node to check
 * @returns Whether the node exists
 */
export const nodeExists = (nodes: Node[], nodeId: string): boolean => {
    return nodes.some((node) => node.id === nodeId);
};

/**
 * Check if an edge exists in the edges array
 * 
 * @param edges Array of edges
 * @param edgeId ID of the edge to check
 * @returns Whether the edge exists
 */
export const edgeExists = (edges: Edge[], edgeId: string): boolean => {
    return edges.some((edge) => edge.id === edgeId);
};

/**
 * Find the level of a condition step in the hierarchy
 * 
 * @param steps All steps in the workflow
 * @param conditionStep The condition step to check
 * @returns The nesting level of the condition step
 */
export const findConditionLevel = (
    steps: AutomationStep[],
    conditionStep: AutomationStep
): number => {
    let level = 0;
    let currentStep = conditionStep;

    while (currentStep.parent_id) {
        const parent = steps.find((s) => s.id === currentStep.parent_id);
        if (parent && parent.type === 'condition') {
            level++;
            currentStep = parent;
        } else {
            break;
        }
    }

    return level;
};

/**
 * Create an edge between two nodes
 * 
 * @param edgeId Unique ID for the edge
 * @param sourceId ID of the source node
 * @param targetId ID of the target node
 * @param edgeType Type of edge to create
 * @param sourceStep Source step data
 * @param targetStep Target step data
 * @param options Additional edge options
 * @returns The created edge
 */
export const createEdge = (
    edgeId: string,
    sourceId: string,
    targetId: string,
    edgeType: EdgeType = EdgeType.DEFAULT,
    sourceStep?: any,
    targetStep?: any,
    options: {
        sourceHandle?: string;
        targetHandle?: string;
        label?: string;
        className?: string;
        fromBranch?: string;
        fromChildMerge?: boolean;
        fromMerge?: boolean;
        condition?: string;
    } = {}
): Edge => {
    const {
        sourceHandle,
        targetHandle,
        label,
        className,
        fromBranch,
        fromChildMerge,
        fromMerge,
        condition
    } = options;

    // Determine edge style based on type
    const style = edgeType === EdgeType.CONDITION
        ? EDGE_STYLES.CONDITION
        : EDGE_STYLES.DEFAULT;

    return {
        id: edgeId,
        source: sourceId,
        target: targetId,
        sourceHandle,
        targetHandle,
        type: edgeType,
        label,
        className,
        style,
        data: {
            sourceStep,
            targetStep,
            fromBranch,
            fromChildMerge,
            fromMerge,
            condition
        }
    };
};

/**
 * Add an edge to the edges array if it doesn't already exist
 * 
 * @param edges Array of edges to modify
 * @param edgeToAdd Edge to add
 * @returns Whether the edge was added
 */
export const addEdgeIfNotExists = (
    edges: Edge[],
    edgeToAdd: Edge
): boolean => {
    if (!edgeExists(edges, edgeToAdd.id)) {
        edges.push(edgeToAdd);
        return true;
    }
    return false;
};

/**
 * Remove duplicate edges from an array of edges
 * 
 * @param edges Array of edges to process
 * @returns Array of unique edges
 */
export const removeDuplicateEdges = (edges: Edge[]): Edge[] => {
    const edgeMap = new Map<string, number>();
    const uniqueEdges: Edge[] = [];

    edges.forEach((edge, index) => {
        const key = `${edge.source}-${edge.target}-${edge.targetHandle || 'default'}`;

        if (edgeMap.has(key)) {
            console.warn('Removing duplicate edge:', {
                edgeId: edge.id,
                key,
                duplicateOf: edgeMap.get(key),
            });
        } else {
            edgeMap.set(key, index);
            uniqueEdges.push(edge);
        }
    });

    return uniqueEdges;
};
