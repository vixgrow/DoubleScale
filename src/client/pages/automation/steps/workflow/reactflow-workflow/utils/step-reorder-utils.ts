/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@quillcrm/client';

/**
 * Helper function to calculate new step orders when moving a step
 */
export const calculateStepReorder = (
    steps: AutomationStep[],
    stepToMove: AutomationStep,
    direction: 'up' | 'down'
): { newSteps: AutomationStep[]; updatedSteps: Record<string, { order: number }> } => {
    const updatedSteps: Record<string, { order: number }> = {};
    const newSteps = [...steps];

    // Filter steps in the same context (same parent and condition)
    const contextSteps = steps.filter((step) => {
        if (stepToMove.parent_id) {
            return (
                step.parent_id === stepToMove.parent_id &&
                step.condition === stepToMove.condition
            );
        } else {
            return !step.parent_id;
        }
    }).sort((a, b) => a.order - b.order);

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
 * Check if step can be moved in a direction
 */
export const canMoveStep = (
    steps: AutomationStep[],
    step: AutomationStep,
    direction: 'up' | 'down'
): boolean => {
    // Filter steps in the same context
    const contextSteps = steps.filter((s) => {
        if (step.parent_id) {
            return s.parent_id === step.parent_id && s.condition === step.condition;
        } else {
            return !s.parent_id;
        }
    }).sort((a, b) => a.order - b.order);

    const currentIndex = contextSteps.findIndex(s => s.id === step.id);

    if (direction === 'up') {
        return currentIndex > 0;
    } else {
        return currentIndex < contextSteps.length - 1;
    }
};

/**
 * Main function to reorder a step and update the database
 */
export const reorderStep = async (
    step: AutomationStep,
    direction: 'up' | 'down',
    steps: AutomationStep[],
    setSteps: (steps: AutomationStep[]) => void,
    createNotice: (notice: { type: string; message: string }) => void
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

        createNotice({
            type: 'success',
            message: direction === 'up'
                ? __('Step moved up', 'quillcrm')
                : __('Step moved down', 'quillcrm'),
        });

        return true;
    } catch (error: any) {
        createNotice({
            type: 'error',
            message: error.message || __('Failed to reorder step', 'quillcrm'),
        });
        return false;
    }
}; 