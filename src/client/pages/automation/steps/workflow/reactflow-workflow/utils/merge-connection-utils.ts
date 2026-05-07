/**
 * Connection utilities for workflow visualization
 * Handles connecting merge nodes, child merges, and subsequent steps
 */

import type { Node, Edge } from '@xyflow/react';
import type { AutomationStep } from '@doublescale/client';
import { createEdge, EdgeType, addEdgeIfNotExists, findConditionLevel } from './edge-utils';

/**
 * Find steps in a specific branch of a condition
 * 
 * @param steps All steps in the workflow
 * @param parentConditionId Parent condition ID
 * @param condition Branch condition ('yes' or 'no')
 * @returns Steps in the specified branch
 */
const getBranchSteps = (
    steps: AutomationStep[],
    parentConditionId: number,
    condition: string
): AutomationStep[] => {
    return steps
        .filter(
            (s) => s.parent_id === parentConditionId && s.condition === condition
        )
        .sort((a, b) => a.order - b.order);
};

/**
 * Generate merge node ID for a condition at a specific level
 * 
 * @param conditionId Condition step ID
 * @param level Nesting level
 * @returns Merge node ID
 */
const getMergeNodeId = (conditionId: number | string, level: number): string => {
    return `merge-${conditionId}-level-${level}`;
};

/**
 * Find the last merge node in a branch that should connect to the parent merge
 * 
 * @param steps All steps in the workflow
 * @param parentConditionId Parent condition ID
 * @param condition Branch condition ('yes' or 'no')
 * @param level Nesting level
 * @returns ID of the last merge node in the branch, or null if none
 */
function findLastMergeInBranch(
    steps: AutomationStep[],
    parentConditionId: number,
    condition: string,
    level: number
): string | null {
    // Get all steps in this branch
    const branchSteps = getBranchSteps(steps, parentConditionId, condition);

    if (branchSteps.length === 0) return null;

    // Find the last condition in this branch
    const lastCondition = branchSteps
        .filter((s) => s.type === 'condition')
        .sort((a, b) => b.order - a.order)[0]; // Get the condition with highest order

    if (lastCondition) {
        // Calculate the level for this last condition
        const conditionLevel = level + 1;
        return getMergeNodeId(lastCondition.id, conditionLevel);
    }

    return null;
}

/**
 * Connect nodes with validation
 * 
 * @param initialNodes Array of nodes
 * @param initialEdges Array of edges
 * @param sourceId Source node ID
 * @param targetId Target node ID
 * @param edgeOptions Edge options
 * @returns Whether the edge was created
 */
const connectNodesIfValid = (
    initialNodes: Node[],
    initialEdges: Edge[],
    sourceId: string,
    targetId: string,
    edgeOptions: {
        edgeId: string;
        edgeType?: EdgeType;
        sourceHandle?: string;
        targetHandle?: string;
        sourceStep?: any;
        targetStep?: any;
        fromBranch?: string;
        fromChildMerge?: boolean;
        fromMerge?: boolean;
        label?: string;
        className?: string;
    }
): boolean => {
    const {
        edgeId,
        edgeType = EdgeType.DEFAULT,
        sourceHandle,
        targetHandle,
        sourceStep,
        targetStep,
        fromBranch,
        fromChildMerge,
        fromMerge,
        label,
        className
    } = edgeOptions;

    // Check if source and target nodes exist
    const sourceExists = initialNodes.some((node) => node.id === sourceId);
    const targetExists = initialNodes.some((node) => node.id === targetId);
    const edgeExists = initialEdges.some((edge) => edge.id === edgeId);

    if (sourceExists && targetExists && !edgeExists) {
        const edge = createEdge(
            edgeId,
            sourceId,
            targetId,
            edgeType,
            sourceStep,
            targetStep,
            {
                sourceHandle,
                targetHandle,
                label,
                className,
                fromBranch,
                fromChildMerge,
                fromMerge
            }
        );

        initialEdges.push(edge);
        return true;
    }

    return false;
}

/**
 * Post-process to ensure all child condition merge nodes connect to their parent merge nodes
 */
export function connectChildMergesToParentMerges(
    steps: AutomationStep[],
    initialNodes: Node[],
    initialEdges: Edge[]
): void {
    const conditionSteps = steps.filter((step) => step.type === 'condition');

    conditionSteps.forEach((conditionStep) => {
        // Find the level of this condition step
        const level = findConditionLevel(steps, conditionStep);

        // Only process child conditions (level > 0)
        if (level > 0 && conditionStep.parent_id) {
            const parentCondition = steps.find(
                (s) => s.id === conditionStep.parent_id
            );

            if (parentCondition && parentCondition.type === 'condition') {
                const childMergeId = getMergeNodeId(conditionStep.id, level);
                const parentLevel = level - 1;
                const parentMergeId = getMergeNodeId(parentCondition.id, parentLevel);

                // Check if there are steps after this child condition that should be connected first
                const stepsAfterChildCondition = steps
                    .filter(
                        (s) =>
                            s.parent_id === conditionStep.parent_id &&
                            s.condition === conditionStep.condition &&
                            s.order > conditionStep.order
                    )
                    .sort((a, b) => a.order - b.order);

                // Connect child merge to parent merge for proper flow
                if (stepsAfterChildCondition.length === 0) {
                    // No subsequent steps, safe to connect directly to parent merge
                    // Determine which handle on the parent merge to connect to
                    // This should match the condition branch this child belongs to
                    const targetHandle = conditionStep.condition;

                    connectNodesIfValid(
                        initialNodes,
                        initialEdges,
                        childMergeId,
                        parentMergeId,
                        {
                            edgeId: `${childMergeId}-to-parent-merge`,
                            targetHandle: targetHandle,
                            sourceStep: {
                                id: childMergeId,
                                type: 'merge',
                            },
                            targetStep: {
                                id: parentMergeId,
                                type: 'merge',
                            },
                            fromBranch: conditionStep.condition,
                            fromChildMerge: true
                        }
                    );
                }
            }
        }
    });
}

/**
 * Connect child merge nodes to subsequent steps in the same branch
 */
export function connectChildMergesToSubsequentSteps(
    steps: AutomationStep[],
    initialNodes: Node[],
    initialEdges: Edge[]
): void {
    const conditionSteps = steps.filter((step) => step.type === 'condition');

    conditionSteps.forEach((conditionStep) => {
        // Find the level of this condition step
        const level = findConditionLevel(steps, conditionStep);

        // Only process child conditions (level > 0)
        if (level > 0 && conditionStep.parent_id) {
            const childMergeId = getMergeNodeId(conditionStep.id, level);

            // Find steps after this child condition in the same branch
            const stepsAfterChildCondition = steps
                .filter(
                    (s) =>
                        s.parent_id === conditionStep.parent_id &&
                        s.condition === conditionStep.condition &&
                        s.order > conditionStep.order
                )
                .sort((a, b) => a.order - b.order);

            if (stepsAfterChildCondition.length > 0) {
                const nextStep = stepsAfterChildCondition[0];

                connectNodesIfValid(
                    initialNodes,
                    initialEdges,
                    childMergeId,
                    nextStep.id.toString(),
                    {
                        edgeId: `${childMergeId}-to-${nextStep.id}`,
                        sourceStep: {
                            id: childMergeId,
                            type: 'merge',
                        },
                        targetStep: nextStep,
                        fromChildMerge: true
                    }
                );
            }
        }
    });
}

/**
 * Connect the last step in each branch to the parent merge node
 */
export function connectLastStepsToParentMerge(
    steps: AutomationStep[],
    initialNodes: Node[],
    initialEdges: Edge[]
): void {
    const conditionSteps = steps.filter((step) => step.type === 'condition');

    conditionSteps.forEach((conditionStep) => {
        // Only process parent conditions that have child conditions
        const hasChildConditions = steps.some(
            (s) => s.parent_id === conditionStep.id && s.type === 'condition'
        );

        if (hasChildConditions) {
            // Find the level of this condition step
            const level = findConditionLevel(steps, conditionStep);
            const parentMergeId = getMergeNodeId(conditionStep.id, level);

            // Process each branch (yes/no)
            ['yes', 'no'].forEach((branchCondition) => {
                // Get all steps in this branch
                const branchSteps = getBranchSteps(steps, conditionStep.id, branchCondition);

                if (branchSteps.length > 0) {
                    // Find the last non-condition step in this branch
                    const lastNonConditionStep = branchSteps
                        .filter((s) => s.type !== 'condition')
                        .sort((a, b) => b.order - a.order)[0]; // Get highest order non-condition step

                    if (lastNonConditionStep) {
                        // Check if there are any child conditions after this step
                        const childConditionsAfter = branchSteps.filter(
                            (s) =>
                                s.type === 'condition' &&
                                s.order > lastNonConditionStep.order
                        );

                        // If this is truly the last step (no child conditions after it)
                        if (childConditionsAfter.length === 0) {
                            // This step should connect to parent merge
                            connectNodesIfValid(
                                initialNodes,
                                initialEdges,
                                lastNonConditionStep.id.toString(),
                                parentMergeId,
                                {
                                    edgeId: `${lastNonConditionStep.id}-to-parent-merge`,
                                    targetHandle: branchCondition,
                                    edgeType: EdgeType.ADD_STEP,
                                    sourceStep: lastNonConditionStep,
                                    targetStep: {
                                        id: parentMergeId,
                                        type: 'merge',
                                    },
                                    fromBranch: branchCondition
                                }
                            );
                        } else {
                            // There are child conditions after this step
                            // Check if those child conditions have subsequent steps
                            let hasSubsequentStepsAfterChildConditions = false;

                            childConditionsAfter.forEach((childCondition) => {
                                const stepsAfterChild = branchSteps.filter(
                                    (s) => s.order > childCondition.order
                                );
                                if (stepsAfterChild.length > 0) {
                                    hasSubsequentStepsAfterChildConditions = true;
                                }
                            });

                            if (hasSubsequentStepsAfterChildConditions) {
                                // Find the truly last step in the branch
                                const trulyLastStep = branchSteps[branchSteps.length - 1];

                                if (trulyLastStep.type !== 'condition') {
                                    connectNodesIfValid(
                                        initialNodes,
                                        initialEdges,
                                        trulyLastStep.id.toString(),
                                        parentMergeId,
                                        {
                                            edgeId: `${trulyLastStep.id}-to-parent-merge`,
                                            targetHandle: branchCondition,
                                            edgeType: EdgeType.ADD_STEP,
                                            sourceStep: trulyLastStep,
                                            targetStep: {
                                                id: parentMergeId,
                                                type: 'merge',
                                            },
                                            fromBranch: branchCondition
                                        }
                                    );
                                }
                            }
                        }
                    }
                }
            });
        }
    });
}

/**
 * Connect merge nodes to subsequent steps after all merge hierarchies are established
 */
export function connectMergesToSubsequentSteps(
    steps: AutomationStep[],
    initialNodes: Node[],
    initialEdges: Edge[]
): void {
    const conditionSteps = steps.filter((step) => step.type === 'condition');

    conditionSteps.forEach((conditionStep) => {
        // Find the level of this condition step
        const level = findConditionLevel(steps, conditionStep);
        const mergeId = getMergeNodeId(conditionStep.id, level);

        // Find subsequent steps at the same level
        const subsequentSteps = steps
            .filter((s) => {
                if (level === 0) {
                    return !s.parent_id && s.order > conditionStep.order;
                } else {
                    return (
                        s.parent_id === conditionStep.parent_id &&
                        s.condition === conditionStep.condition &&
                        s.order > conditionStep.order
                    );
                }
            })
            .sort((a, b) => a.order - b.order);

        if (subsequentSteps.length > 0) {
            const nextStep = subsequentSteps[0];

            // Check if this merge node exists
            const mergeExists = initialNodes.some(
                (node) => node.id === mergeId
            );

            if (mergeExists) {
                // For root level conditions, check if there are child conditions that should connect first
                if (level === 0) {
                    // Check if there are child conditions in either branch that should connect first
                    const yesLastMerge = findLastMergeInBranch(
                        steps,
                        conditionStep.id,
                        'yes',
                        level
                    );
                    const noLastMerge = findLastMergeInBranch(
                        steps,
                        conditionStep.id,
                        'no',
                        level
                    );

                    // If there are no child merges, safe to connect directly
                    if (!yesLastMerge && !noLastMerge) {
                        connectNodesIfValid(
                            initialNodes,
                            initialEdges,
                            mergeId,
                            nextStep.id.toString(),
                            {
                                edgeId: `${mergeId}-to-${nextStep.id}`,
                                sourceStep: {
                                    id: mergeId,
                                    type: 'merge',
                                },
                                targetStep: nextStep,
                                fromMerge: true
                            }
                        );
                    }
                }
            }
        }
    });
}

/**
 * Final pass: Connect the appropriate merge nodes to subsequent root-level steps
 */
export function connectFinalMergeToSubsequentSteps(
    steps: AutomationStep[],
    initialNodes: Node[],
    initialEdges: Edge[]
): void {
    // Find root-level conditions that have subsequent steps
    const rootConditions = steps
        .filter(
            (s) =>
                s.type === 'condition' && (!s.parent_id || s.parent_id === 0)
        )
        .sort((a, b) => a.order - b.order);

    rootConditions.forEach((rootCondition) => {
        // Find subsequent root-level steps
        const subsequentSteps = steps
            .filter(
                (s) =>
                    (!s.parent_id || s.parent_id === 0) &&
                    s.order > rootCondition.order
            )
            .sort((a, b) => a.order - b.order);

        if (subsequentSteps.length > 0) {
            const nextStep = subsequentSteps[0];
            const rootMergeId = getMergeNodeId(rootCondition.id, 0);

            // Find the deepest merge nodes in each branch that should connect to the root merge
            const yesLastMerge = findLastMergeInBranch(
                steps,
                rootCondition.id,
                'yes',
                0
            );
            const noLastMerge = findLastMergeInBranch(
                steps,
                rootCondition.id,
                'no',
                0
            );

            // Connect root merge to subsequent step regardless of child merges
            // The child-to-root connections are already handled separately
            connectNodesIfValid(
                initialNodes,
                initialEdges,
                rootMergeId,
                nextStep.id.toString(),
                {
                    edgeId: `${rootMergeId}-to-${nextStep.id}`,
                    sourceStep: {
                        id: rootMergeId,
                        type: 'merge',
                    },
                    targetStep: nextStep,
                    fromMerge: true
                }
            );
        }
    });
}