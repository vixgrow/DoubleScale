/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { arrayMove } from '@dnd-kit/sortable';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@doublescale/client';

export type StepUpdatePayload = {
    order: number;
    parent_id?: number;
    condition?: string;
};

/**
 * Filter steps in a specific parent/condition context.
 */
export const getContextStepsByParent = (
    steps: AutomationStep[],
    parentId: number,
    condition: string
): AutomationStep[] => {
    return steps
        .filter((s) => {
            if (parentId) {
                return s.parent_id === parentId && s.condition === condition;
            }
            return !s.parent_id || s.parent_id === 0;
        })
        .sort((a, b) => a.order - b.order);
};

/**
 * Filter steps that share the same parent/condition context as the given step.
 */
export const getContextSteps = (
    steps: AutomationStep[],
    step: AutomationStep
): AutomationStep[] => {
    const parentId = step.parent_id || 0;
    const condition = parentId ? step.condition : '';
    return getContextStepsByParent(steps, parentId, condition);
};

/**
 * Check whether two steps belong to the same reorder context.
 */
export const areStepsInSameContext = (
    stepA: AutomationStep,
    stepB: AutomationStep
): boolean => {
    const parentA = stepA.parent_id || 0;
    const parentB = stepB.parent_id || 0;

    if (parentA !== parentB) {
        return false;
    }

    if (parentA) {
        return stepA.condition === stepB.condition;
    }

    return true;
};

/**
 * Check if a step is a descendant of another step.
 */
export const isDescendantOf = (
    steps: AutomationStep[],
    ancestorId: number,
    candidateId: number
): boolean => {
    const children = steps.filter((s) => s.parent_id === ancestorId);

    for (const child of children) {
        if (child.id === candidateId) {
            return true;
        }
        if (isDescendantOf(steps, child.id, candidateId)) {
            return true;
        }
    }

    return false;
};

/**
 * Validate whether a step can be reparented to a target context.
 */
export const canReparentToContext = (
    steps: AutomationStep[],
    stepToMove: AutomationStep,
    targetParentId: number,
    targetCondition: string
): boolean => {
    if (targetParentId === stepToMove.id) {
        return false;
    }

    if (targetParentId && isDescendantOf(steps, stepToMove.id, targetParentId)) {
        return false;
    }

    return true;
};

const applySequentialOrders = (
    newSteps: AutomationStep[],
    updatedSteps: Record<string, StepUpdatePayload>,
    orderedSteps: AutomationStep[],
    stepFieldUpdates: Record<number, { parent_id?: number; condition?: string }> = {}
): void => {
    orderedSteps.forEach((step, index) => {
        const newOrder = index + 1;
        const fieldUpdates = stepFieldUpdates[step.id] || {};
        const stepIndex = newSteps.findIndex((s) => s.id === step.id);

        if (stepIndex === -1) {
            return;
        }

        const current = newSteps[stepIndex];
        const hasChanges =
            current.order !== newOrder ||
            fieldUpdates.parent_id !== undefined ||
            fieldUpdates.condition !== undefined;

        if (!hasChanges) {
            return;
        }

        newSteps[stepIndex] = {
            ...current,
            order: newOrder,
            ...(fieldUpdates.parent_id !== undefined
                ? { parent_id: fieldUpdates.parent_id }
                : {}),
            ...(fieldUpdates.condition !== undefined
                ? { condition: fieldUpdates.condition }
                : {}),
        };

        updatedSteps[step.id] = {
            order: newOrder,
            ...(fieldUpdates.parent_id !== undefined
                ? { parent_id: fieldUpdates.parent_id }
                : {}),
            ...(fieldUpdates.condition !== undefined
                ? { condition: fieldUpdates.condition }
                : {}),
        };
    });
};

/**
 * Helper function to calculate new step orders when moving a step
 */
export const calculateStepReorder = (
    steps: AutomationStep[],
    stepToMove: AutomationStep,
    direction: 'up' | 'down'
): { newSteps: AutomationStep[]; updatedSteps: Record<string, StepUpdatePayload> } => {
    const contextSteps = getContextSteps(steps, stepToMove);
    const currentIndex = contextSteps.findIndex((step) => step.id === stepToMove.id);

    if (currentIndex === -1) {
        return { newSteps: [...steps], updatedSteps: {} };
    }

    const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= contextSteps.length) {
        return { newSteps: [...steps], updatedSteps: {} };
    }

    return calculateStepMove(
        steps,
        stepToMove,
        contextSteps[targetIndex].id
    );
};

/**
 * Calculate new step orders when moving a step to an arbitrary position within its context.
 */
export const calculateStepMove = (
    steps: AutomationStep[],
    stepToMove: AutomationStep,
    targetStepId: number | string
): { newSteps: AutomationStep[]; updatedSteps: Record<string, StepUpdatePayload> } => {
    const updatedSteps: Record<string, StepUpdatePayload> = {};
    const newSteps = [...steps];

    const contextSteps = getContextSteps(steps, stepToMove);
    const currentIndex = contextSteps.findIndex((s) => s.id === stepToMove.id);
    const targetIndex = contextSteps.findIndex(
        (s) => s.id.toString() === targetStepId.toString()
    );

    if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) {
        return { newSteps, updatedSteps };
    }

    const reordered = arrayMove(contextSteps, currentIndex, targetIndex);

    applySequentialOrders(newSteps, updatedSteps, reordered);

    return { newSteps, updatedSteps };
};

/**
 * Move a step into a target context (e.g. empty branch via add-step drop zone).
 */
export const calculateStepReparentToContext = (
    steps: AutomationStep[],
    stepToMove: AutomationStep,
    targetParentId: number,
    targetCondition: string
): { newSteps: AutomationStep[]; updatedSteps: Record<string, StepUpdatePayload> } => {
    const updatedSteps: Record<string, StepUpdatePayload> = {};
    const newSteps = [...steps];

    if (!canReparentToContext(steps, stepToMove, targetParentId, targetCondition)) {
        return { newSteps, updatedSteps };
    }

    const targetContext = getContextStepsByParent(
        steps,
        targetParentId,
        targetCondition
    );

    if (targetContext.length === 0) {
        const sourceContext = getContextSteps(steps, stepToMove);
        const sourceAfter = sourceContext.filter((s) => s.id !== stepToMove.id);

        applySequentialOrders(newSteps, updatedSteps, sourceAfter);

        const stepIndex = newSteps.findIndex((s) => s.id === stepToMove.id);
        if (stepIndex !== -1) {
            newSteps[stepIndex] = {
                ...newSteps[stepIndex],
                parent_id: targetParentId,
                condition: targetCondition,
                order: 1,
            };
            updatedSteps[stepToMove.id] = {
                order: 1,
                parent_id: targetParentId,
                condition: targetCondition,
            };
        }

        return { newSteps, updatedSteps };
    }

    const sourceContext = getContextSteps(steps, stepToMove);
    const sourceAfter = sourceContext.filter((s) => s.id !== stepToMove.id);
    const targetAfter = [
        ...targetContext,
        {
            ...stepToMove,
            parent_id: targetParentId,
            condition: targetCondition,
        },
    ];

    applySequentialOrders(newSteps, updatedSteps, sourceAfter);
    applySequentialOrders(newSteps, updatedSteps, targetAfter, {
        [stepToMove.id]: {
            parent_id: targetParentId,
            condition: targetCondition,
        },
    });

    return { newSteps, updatedSteps };
};

/**
 * Calculate updates when moving a step to another context or position.
 */
export const calculateStepReparent = (
    steps: AutomationStep[],
    stepToMove: AutomationStep,
    targetStepId: number | string
): { newSteps: AutomationStep[]; updatedSteps: Record<string, StepUpdatePayload> } => {
    const updatedSteps: Record<string, StepUpdatePayload> = {};
    const newSteps = [...steps];

    const targetStep = steps.find(
        (s) => s.id.toString() === targetStepId.toString()
    );

    if (!targetStep || stepToMove.id === targetStep.id) {
        return { newSteps, updatedSteps };
    }

    if (isDescendantOf(steps, stepToMove.id, targetStep.id)) {
        return { newSteps, updatedSteps };
    }

    if (areStepsInSameContext(stepToMove, targetStep)) {
        return calculateStepMove(steps, stepToMove, targetStepId);
    }

    const targetParentId = targetStep.parent_id || 0;
    const targetCondition = targetParentId ? targetStep.condition : '';

    if (!canReparentToContext(steps, stepToMove, targetParentId, targetCondition)) {
        return { newSteps, updatedSteps };
    }

    const sourceContext = getContextSteps(steps, stepToMove);
    const sourceAfter = sourceContext.filter((s) => s.id !== stepToMove.id);

    const targetContext = getContextStepsByParent(
        steps,
        targetParentId,
        targetCondition
    );
    const targetIndex = targetContext.findIndex((s) => s.id === targetStep.id);
    const targetAfter = [...targetContext];
    targetAfter.splice(targetIndex, 0, {
        ...stepToMove,
        parent_id: targetParentId,
        condition: targetCondition,
    });

    applySequentialOrders(newSteps, updatedSteps, sourceAfter);
    applySequentialOrders(newSteps, updatedSteps, targetAfter, {
        [stepToMove.id]: {
            parent_id: targetParentId,
            condition: targetCondition,
        },
    });

    return { newSteps, updatedSteps };
};

/**
 * Check if step can be moved in a direction
 */
export const canMoveStep = (
    steps: AutomationStep[],
    step: AutomationStep,
    direction: 'up' | 'down'
): boolean => {
    const contextSteps = getContextSteps(steps, step);
    const currentIndex = contextSteps.findIndex((s) => s.id === step.id);

    if (direction === 'up') {
        return currentIndex > 0;
    }

    return currentIndex < contextSteps.length - 1;
};

const persistStepMove = async (
    stepId: number,
    updatedSteps: Record<string, StepUpdatePayload>,
    setSteps: (steps: AutomationStep[]) => void,
    newSteps: AutomationStep[],
    createNotice: (notice: { type: string; message: string }) => void,
    clearPositions?: () => void,
    successMessage?: string
): Promise<boolean> => {
    if (Object.keys(updatedSteps).length === 0) {
        return false;
    }

    if (clearPositions) {
        clearPositions();
    }

    await apiFetch({
        path: `/doublescale/v1/automation-steps/${stepId}/reorder`,
        method: 'POST',
        data: {
            direction: 'move',
            updated_steps: updatedSteps,
        },
    });

    setSteps(newSteps);

    createNotice({
        type: 'success',
        message: successMessage || __('Step moved', 'doublescale'),
    });

    return true;
};

/**
 * Main function to reorder a step and update the database
 */
export const reorderStep = async (
    step: AutomationStep,
    direction: 'up' | 'down',
    steps: AutomationStep[],
    setSteps: (steps: AutomationStep[]) => void,
    createNotice: (notice: { type: string; message: string }) => void,
    clearPositions?: () => void
): Promise<boolean> => {
    try {
        const { newSteps, updatedSteps } = calculateStepReorder(steps, step, direction);

        if (Object.keys(updatedSteps).length === 0) {
            return false;
        }

        if (clearPositions) {
            clearPositions();
        }

        await apiFetch({
            path: `/doublescale/v1/automation-steps/${step.id}/reorder`,
            method: 'POST',
            data: {
                direction,
                updated_steps: updatedSteps,
            },
        });

        setSteps(newSteps);

        createNotice({
            type: 'success',
            message: direction === 'up'
                ? __('Step moved up', 'doublescale')
                : __('Step moved down', 'doublescale'),
        });

        return true;
    } catch (error: any) {
        createNotice({
            type: 'error',
            message: error.message || __('Failed to reorder step', 'doublescale'),
        });
        return false;
    }
};

/**
 * Move a step onto another step (same or different context).
 */
export const moveStep = async (
    step: AutomationStep,
    targetStepId: number | string,
    steps: AutomationStep[],
    setSteps: (steps: AutomationStep[]) => void,
    createNotice: (notice: { type: string; message: string }) => void,
    clearPositions?: () => void
): Promise<boolean> => {
    try {
        const { newSteps, updatedSteps } = calculateStepReparent(
            steps,
            step,
            targetStepId
        );

        return await persistStepMove(
            step.id,
            updatedSteps,
            setSteps,
            newSteps,
            createNotice,
            clearPositions
        );
    } catch (error: any) {
        createNotice({
            type: 'error',
            message: error.message || __('Failed to reorder step', 'doublescale'),
        });
        return false;
    }
};

/**
 * Move a step into a branch/root context (e.g. via add-step drop zone).
 */
export const moveStepToContext = async (
    step: AutomationStep,
    targetParentId: number,
    targetCondition: string,
    steps: AutomationStep[],
    setSteps: (steps: AutomationStep[]) => void,
    createNotice: (notice: { type: string; message: string }) => void,
    clearPositions?: () => void
): Promise<boolean> => {
    try {
        const { newSteps, updatedSteps } = calculateStepReparentToContext(
            steps,
            step,
            targetParentId,
            targetCondition
        );

        return await persistStepMove(
            step.id,
            updatedSteps,
            setSteps,
            newSteps,
            createNotice,
            clearPositions
        );
    } catch (error: any) {
        createNotice({
            type: 'error',
            message: error.message || __('Failed to reorder step', 'doublescale'),
        });
        return false;
    }
};
