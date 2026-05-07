/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@doublescale/client';

/**
 * Filter steps in the same context (same parent and condition)
 * 
 * @param steps All steps in the workflow
 * @param referenceStep The step to use as reference for context
 * @returns Steps in the same context as the reference step
 */
export const getContextSteps = (
    steps: AutomationStep[],
    referenceStep: AutomationStep
): AutomationStep[] => {
    return steps
        .filter((step) => {
            if (referenceStep.parent_id) {
                return (
                    step.parent_id === referenceStep.parent_id &&
                    step.condition === referenceStep.condition
                );
            } else {
                return !step.parent_id || step.parent_id === 0;
            }
        })
        .sort((a, b) => a.order - b.order);
};

/**
 * Calculate updated orders for steps after a step is removed
 * 
 * @param steps All steps in the workflow
 * @param stepToRemove The step being removed
 * @returns Updated steps and order changes
 */
export const calculateStepOrdersAfterRemoval = (
    steps: AutomationStep[],
    stepToRemove: AutomationStep
): { updatedOrdersSteps: Record<string, { order: number }>, newSteps: AutomationStep[] } => {
    const updatedOrdersSteps: Record<string, { order: number }> = {};
    const newSteps = [...steps];

    // Get steps in the same context (same parent and condition)
    const contextSteps = getContextSteps(steps, stepToRemove)
        .filter((s) => s.id !== stepToRemove.id)
        .sort((a, b) => a.order - b.order);

    // Reorder steps in the same context
    contextSteps.forEach((step, index) => {
        const newOrder = index + 1;
        if (newOrder !== step.order) {
            updatedOrdersSteps[step.id] = {
                order: newOrder,
            };
        }
    });

    return { updatedOrdersSteps, newSteps };
};

/**
 * Delete a step and update the orders of remaining steps
 * 
 * @param stepId ID of the step to delete
 * @param steps All steps in the workflow
 * @param setSteps Function to update steps state
 * @param createNotice Function to show notifications
 * @returns Promise resolving when deletion is complete
 */
export const deleteStep = async (
    stepId: string,
    steps: AutomationStep[],
    setSteps: (steps: AutomationStep[]) => void,
    createNotice: (notice: { type: string, message: string }) => void
): Promise<void> => {
    // Find the step to delete
    const stepToDelete = steps.find((s) => s.id.toString() === stepId);
    if (!stepToDelete) {
        console.error('Step not found:', stepId);
        return;
    }

    const { updatedOrdersSteps, newSteps } = calculateStepOrdersAfterRemoval(steps, stepToDelete);

    try {
        // Make API call to delete the step using the correct endpoint
        await apiFetch({
            path: `/qc/v1/automation-steps/${stepId}`,
            method: 'DELETE',
            data: {
                updated_steps: updatedOrdersSteps,
            },
        });

        // Update local state
        const updatedSteps = newSteps.filter((s) => s.id.toString() !== stepId);
        setSteps(updatedSteps);

        createNotice({
            type: 'success',
            message: __('Step deleted', 'doublescale'),
        });
    } catch (error: any) {
        createNotice({
            type: 'error',
            message: error.message || __('Failed to delete step', 'doublescale'),
        });
    }
};

/**
 * Check if a step can be moved in a specific direction
 * 
 * @param steps All steps in the workflow
 * @param step The step to check
 * @param direction Direction to move (up or down)
 * @returns Whether the step can be moved
 */
export const canMoveStep = (
    steps: AutomationStep[],
    step: AutomationStep,
    direction: 'up' | 'down'
): boolean => {
    // Filter steps in the same context
    const contextSteps = getContextSteps(steps, step);
    const currentIndex = contextSteps.findIndex(s => s.id === step.id);

    if (direction === 'up') {
        return currentIndex > 0;
    } else {
        return currentIndex < contextSteps.length - 1;
    }
};

/**
 * Calculate new step orders when moving a step
 * 
 * @param steps All steps in the workflow
 * @param stepToMove The step being moved
 * @param direction Direction to move (up or down)
 * @returns Updated steps and order changes
 */
export const calculateStepReorder = (
    steps: AutomationStep[],
    stepToMove: AutomationStep,
    direction: 'up' | 'down'
): { newSteps: AutomationStep[]; updatedSteps: Record<string, { order: number }> } => {
    const updatedSteps: Record<string, { order: number }> = {};
    const newSteps = [...steps];

    // Filter steps in the same context
    const contextSteps = getContextSteps(steps, stepToMove);
    const currentIndex = contextSteps.findIndex(step => step.id === stepToMove.id);

    if (currentIndex === -1) return { newSteps, updatedSteps };

    let targetIndex: number;
    if (direction === 'up') {
        targetIndex = Math.max(0, currentIndex - 1);
    } else {
        targetIndex = Math.min(contextSteps.length - 1, currentIndex + 1);
    }

    // If no movement needed, return unchanged
    if (targetIndex === currentIndex) {
        return { newSteps, updatedSteps };
    }

    // Swap the orders
    const targetStep = contextSteps[targetIndex];
    const currentOrder = stepToMove.order;
    const targetOrder = targetStep.order;

    // Update the step objects in newSteps array
    const stepToMoveIndex = newSteps.findIndex(s => s.id === stepToMove.id);
    const targetStepIndex = newSteps.findIndex(s => s.id === targetStep.id);

    if (stepToMoveIndex !== -1) {
        newSteps[stepToMoveIndex] = { ...newSteps[stepToMoveIndex], order: targetOrder };
        updatedSteps[stepToMove.id] = { order: targetOrder };
    }

    if (targetStepIndex !== -1) {
        newSteps[targetStepIndex] = { ...newSteps[targetStepIndex], order: currentOrder };
        updatedSteps[targetStep.id] = { order: currentOrder };
    }

    return { newSteps, updatedSteps };
};

/**
 * Move a step up or down and update the database
 * 
 * @param step The step to move
 * @param direction Direction to move (up or down)
 * @param steps All steps in the workflow
 * @param setSteps Function to update steps state
 * @param createNotice Function to show notifications
 * @param clearPositions Optional function to clear saved positions
 * @returns Promise resolving to success status
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

        // If no changes, return early
        if (Object.keys(updatedSteps).length === 0) {
            return false;
        }

        // Update the database
        await apiFetch({
            path: `/qc/v1/automation-steps/${step.id}/reorder`,
            method: 'POST',
            data: {
                direction,
                updated_steps: updatedSteps,
            },
        });

        // Update local state
        setSteps(newSteps);

        // Clear saved positions so workflow will re-layout with new order
        if (clearPositions) {
            clearPositions();
        }

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
