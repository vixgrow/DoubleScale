/**
 * Connection utilities for workflow visualization
 * Handles connecting merge nodes, child merges, and subsequent steps
 */

import type { Node, Edge } from '@xyflow/react';
import type { AutomationStep } from '@quillcrm/client';

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

        // Only process child conditions (level > 0)
        if (level > 0 && conditionStep.parent_id) {
            const parentCondition = steps.find(
                (s) => s.id === conditionStep.parent_id
            );
            if (parentCondition && parentCondition.type === 'condition') {
                const childMergeId = `merge-${conditionStep.id}-level-${level}`;
                const parentLevel = level - 1;
                const parentMergeId = `merge-${parentCondition.id}-level-${parentLevel}`;

                // Check if this child merge node exists and parent merge node exists
                const childMergeExists = initialNodes.some(
                    (node) => node.id === childMergeId
                );
                const parentMergeExists = initialNodes.some(
                    (node) => node.id === parentMergeId
                );

                // Check if edge already exists
                const edgeId = `${childMergeId}-to-parent-merge`;
                const edgeExists = initialEdges.some(
                    (edge) => edge.id === edgeId
                );

                // Check if there are steps after this child condition that should be connected first
                // Find steps in the same branch after this condition
                const stepsAfterChildCondition = steps
                    .filter(
                        (s) =>
                            s.parent_id === conditionStep.parent_id &&
                            s.condition === conditionStep.condition &&
                            s.order > conditionStep.order
                    )
                    .sort((a, b) => a.order - b.order);

                // Connect child merge to parent merge for proper flow
                if (childMergeExists && parentMergeExists && !edgeExists) {
                    // If there are steps after this child condition, don't connect directly to parent
                    // The subsequent steps should handle the connection chain
                    if (stepsAfterChildCondition.length > 0) {
                    } else {
                        // No subsequent steps, safe to connect directly to parent merge
                        // Determine which handle on the parent merge to connect to
                        // This should match the condition branch this child belongs to
                        const targetHandle = conditionStep.condition;

                        initialEdges.push({
                            id: edgeId,
                            source: childMergeId,
                            target: parentMergeId,
                            targetHandle: targetHandle,
                            type: 'default',
                            style: {
                                stroke: '#D7D7DA',
                                strokeWidth: 2,
                            },
                            data: {
                                sourceStep: {
                                    id: childMergeId,
                                    type: 'merge',
                                },
                                targetStep: {
                                    id: parentMergeId,
                                    type: 'merge',
                                },
                                fromBranch: conditionStep.condition,
                                fromChildMerge: true,
                            },
                        });
                    }
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

        // Only process child conditions (level > 0)
        if (level > 0 && conditionStep.parent_id) {
            const childMergeId = `merge-${conditionStep.id}-level-${level}`;

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
                const edgeId = `${childMergeId}-to-${nextStep.id}`;

                // Check if this merge node exists and edge doesn't already exist
                const mergeExists = initialNodes.some(
                    (node) => node.id === childMergeId
                );
                const edgeExists = initialEdges.some(
                    (edge) => edge.id === edgeId
                );

                if (mergeExists && !edgeExists) {
                    initialEdges.push({
                        id: edgeId,
                        source: childMergeId,
                        target: nextStep.id.toString(),
                        type: 'default',
                        style: {
                            stroke: '#D7D7DA',
                            strokeWidth: 2,
                        },
                        data: {
                            sourceStep: {
                                id: childMergeId,
                                type: 'merge',
                            },
                            targetStep: nextStep,
                            fromChildMerge: true,
                        },
                    });
                }
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
            let level = 0;
            let currentStep = conditionStep;
            while (currentStep.parent_id) {
                const parent = steps.find(
                    (s) => s.id === currentStep.parent_id
                );
                if (parent && parent.type === 'condition') {
                    level++;
                    currentStep = parent;
                } else {
                    break;
                }
            }

            const parentMergeId = `merge-${conditionStep.id}-level-${level}`;

            // Process each branch (yes/no)
            ['yes', 'no'].forEach((branchCondition) => {
                // Get all steps in this branch
                const branchSteps = steps
                    .filter(
                        (s) =>
                            s.parent_id === conditionStep.id &&
                            s.condition === branchCondition
                    )
                    .sort((a, b) => a.order - b.order);

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
                        // OR if there are child conditions but they have subsequent steps
                        if (childConditionsAfter.length === 0) {
                            // This step should connect to parent merge
                            const edgeId = `${lastNonConditionStep.id}-to-parent-merge`;
                            const edgeExists = initialEdges.some(
                                (edge) => edge.id === edgeId
                            );

                            if (!edgeExists) {
                                initialEdges.push({
                                    id: edgeId,
                                    source: lastNonConditionStep.id.toString(),
                                    target: parentMergeId,
                                    targetHandle: branchCondition,
                                    type: 'addStepEdge',
                                    style: {
                                        stroke: '#D7D7DA',
                                        strokeWidth: 2,
                                    },
                                    data: {
                                        sourceStep: lastNonConditionStep,
                                        targetStep: {
                                            id: parentMergeId,
                                            type: 'merge',
                                        },
                                        fromBranch: branchCondition,
                                    },
                                });
                            }
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
                                const trulyLastStep =
                                    branchSteps[branchSteps.length - 1];
                                const edgeId = `${trulyLastStep.id}-to-parent-merge`;
                                const edgeExists = initialEdges.some(
                                    (edge) => edge.id === edgeId
                                );

                                if (
                                    !edgeExists &&
                                    trulyLastStep.type !== 'condition'
                                ) {
                                    initialEdges.push({
                                        id: edgeId,
                                        source: trulyLastStep.id.toString(),
                                        target: parentMergeId,
                                        targetHandle: branchCondition,
                                        type: 'addStepEdge',
                                        style: {
                                            stroke: '#D7D7DA',
                                            strokeWidth: 2,
                                        },
                                        data: {
                                            sourceStep: trulyLastStep,
                                            targetStep: {
                                                id: parentMergeId,
                                                type: 'merge',
                                            },
                                            fromBranch: branchCondition,
                                        },
                                    });
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
 * Helper function to find the last merge node in a branch that should connect to the parent merge
 */
function findLastMergeInBranch(
    steps: AutomationStep[],
    parentConditionId: number,
    condition: string,
    level: number
): string | null {
    // Get all steps in this branch
    const branchSteps = steps
        .filter(
            (s) =>
                s.parent_id === parentConditionId && s.condition === condition
        )
        .sort((a, b) => a.order - b.order);

    if (branchSteps.length === 0) return null;

    // Find the last condition in this branch
    const lastCondition = branchSteps
        .filter((s) => s.type === 'condition')
        .sort((a, b) => b.order - a.order)[0]; // Get the condition with highest order

    if (lastCondition) {
        // Calculate the level for this last condition
        let conditionLevel = level + 1;
        const lastConditionMergeId = `merge-${lastCondition.id}-level-${conditionLevel}`;

        return lastConditionMergeId;
    }

    return null;
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

        const mergeId = `merge-${conditionStep.id}-level-${level}`;

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

                    // If there are child merges, they will handle the connection to this merge
                    // and this merge should not directly connect to subsequent steps
                    if (yesLastMerge || noLastMerge) {
                    } else {
                        // No child merges, safe to connect directly
                        const edgeId = `${mergeId}-to-${nextStep.id}`;
                        const edgeExists = initialEdges.some(
                            (edge) => edge.id === edgeId
                        );

                        if (!edgeExists) {
                            initialEdges.push({
                                id: edgeId,
                                source: mergeId,
                                target: nextStep.id.toString(),
                                type: 'default',
                                style: {
                                    stroke: '#D7D7DA',
                                    strokeWidth: 2,
                                },
                                data: {
                                    sourceStep: {
                                        id: mergeId,
                                        type: 'merge',
                                    },
                                    targetStep: nextStep,
                                    fromMerge: true,
                                },
                            });
                        }
                    }
                } else {
                    // For child conditions, the connection will flow through parent merge
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
            const rootMergeId = `merge-${rootCondition.id}-level-0`;

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

            // If there are no child merges, the root merge should connect to the next step
            if (!yesLastMerge && !noLastMerge) {
                const edgeId = `${rootMergeId}-to-${nextStep.id}`;
                const edgeExists = initialEdges.some(
                    (edge) => edge.id === edgeId
                );

                if (!edgeExists) {
                    initialEdges.push({
                        id: edgeId,
                        source: rootMergeId,
                        target: nextStep.id.toString(),
                        type: 'default',
                        style: {
                            stroke: '#D7D7DA',
                            strokeWidth: 2,
                        },
                        data: {
                            sourceStep: {
                                id: rootMergeId,
                                type: 'merge',
                            },
                            targetStep: nextStep,
                            fromMerge: true,
                        },
                    });
                }
            } else {
                // There are child merges, so the flow goes:
                // child merges → root merge → subsequent step
                // The child-to-root connections are already handled
                // Now ensure root merge connects to subsequent step
                const edgeId = `${rootMergeId}-to-${nextStep.id}`;
                const edgeExists = initialEdges.some(
                    (edge) => edge.id === edgeId
                );

                if (!edgeExists) {
                    initialEdges.push({
                        id: edgeId,
                        source: rootMergeId,
                        target: nextStep.id.toString(),
                        type: 'default',
                        style: {
                            stroke: '#D7D7DA',
                            strokeWidth: 2,
                        },
                        data: {
                            sourceStep: {
                                id: rootMergeId,
                                type: 'merge',
                            },
                            targetStep: nextStep,
                            fromMerge: true,
                        },
                    });
                }
            }
        }
    });
}