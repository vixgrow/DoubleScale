import { AutomationStep } from "../../../../../../types";
import { Edge } from "@xyflow/react";
import { SPACING_CONSTANTS, LAYOUT_CONSTANTS } from "@doublescale/config";
import { PositionCalculationParams } from "../types";

/**
 * Utility Functions
 */
const calculateBranchWidth = (
    stepList: AutomationStep[],
    parentId: number | null,
    condition: string | null,
    level: number = 0
): number => {
    const branchSteps = stepList
        .filter((step) => {
            if (parentId === null) {
                return !step.parent_id || step.parent_id === 0;
            }
            return step.parent_id === parentId && step.condition === condition;
        })
        .sort((a, b) => a.order - b.order);

    const baseWidth = SPACING_CONSTANTS.BASE_WIDTH;
    const levelMultiplier = 1 + level * SPACING_CONSTANTS.LEVEL_MULTIPLIER;
    const minWidth = baseWidth * levelMultiplier;

    if (branchSteps.length === 0) {
        return minWidth;
    }

    let maxWidth = minWidth;

    branchSteps.forEach((step) => {
        if (step.type === 'condition') {
            const yesWidth = calculateBranchWidth(
                stepList,
                step.id,
                'yes',
                level + 1
            );
            const noWidth = calculateBranchWidth(
                stepList,
                step.id,
                'no',
                level + 1
            );
            const branchSpacing = Math.max(100, 60 + level * 20);
            const conditionWidth = yesWidth + noWidth + branchSpacing;
            const adjustedWidth = Math.max(conditionWidth, minWidth);
            maxWidth = Math.max(maxWidth, adjustedWidth);
        }
    });

    const complexityPadding =
        level > 0 ? 50 + level * 30 : SPACING_CONSTANTS.COMPLEXITY_PADDING;
    return maxWidth + complexityPadding;
};

const calculatePositions = (
    {
        stepList,
        parentId = null,
        condition = null,
        level = 0,
        startX,
        startY,
    }: PositionCalculationParams,
    positionMap: Map<string, { x: number; y: number }>
): number => {
    const branchSteps = stepList
        .filter((step) => {
            if (parentId === null) {
                return !step.parent_id || step.parent_id === 0;
            }
            return step.parent_id === parentId && step.condition === condition;
        })
        .sort((a, b) => a.order - b.order);

    let currentY = startY;

    branchSteps.forEach((step) => {
        const stepId = step.id.toString();

        if (step.type === 'condition') {
            const yesWidth = calculateBranchWidth(
                stepList,
                step.id,
                'yes',
                level + 1
            );
            const noWidth = calculateBranchWidth(
                stepList,
                step.id,
                'no',
                level + 1
            );
            const conditionY = currentY + LAYOUT_CONSTANTS.INCREMENT_Y;

            positionMap.set(stepId, { x: startX, y: conditionY });

            const baseSpacing = SPACING_CONSTANTS.BASE_SPACING;
            const levelMultiplier = 1 + level * 0.3;
            const childY = conditionY + baseSpacing * levelMultiplier;
            const branchGap = Math.max(
                SPACING_CONSTANTS.BRANCH_SPACING,
                80 + level * 30
            );
            const totalChildWidth = yesWidth + noWidth + branchGap;

            const yesX = startX - totalChildWidth / 2 + yesWidth / 2;
            const yesEndY = calculatePositions(
                {
                    stepList,
                    parentId: step.id,
                    condition: 'yes',
                    level: level + 1,
                    startX: yesX,
                    startY: childY,
                },
                positionMap
            );

            const noX = startX + totalChildWidth / 2 - noWidth / 2;
            const noEndY = calculatePositions(
                {
                    stepList,
                    parentId: step.id,
                    condition: 'no',
                    level: level + 1,
                    startX: noX,
                    startY: childY,
                },
                positionMap
            );

            const maxBranchEndY = Math.max(yesEndY, noEndY);
            const hasNestedConditions = stepList.some(
                (s) => s.parent_id === step.id && s.type === 'condition'
            );
            const baseBottomSpacing = hasNestedConditions ? 300 : 250;
            const mergeSpacing = Math.max(
                SPACING_CONSTANTS.BRANCH_SPACING,
                100 + level * 25
            );
            const levelSpacing = level * 50;
            const nestedConditionSpacing = hasNestedConditions ? 100 : 0;

            currentY = Math.max(
                conditionY +
                baseBottomSpacing +
                levelSpacing +
                nestedConditionSpacing,
                maxBranchEndY +
                mergeSpacing +
                levelSpacing +
                nestedConditionSpacing
            );
        } else {
            currentY += LAYOUT_CONSTANTS.INCREMENT_Y;
            positionMap.set(stepId, { x: startX, y: currentY });
        }
    });

    return currentY;
};

const getNodePosition = (
    nodeId: string,
    savedPositions: Record<string, { x: number; y: number }>,
    positionMap: Map<string, { x: number; y: number }>,
    steps: AutomationStep[],
    fallbackX = LAYOUT_CONSTANTS.START_X,
    fallbackY = LAYOUT_CONSTANTS.START_Y,
    step?: AutomationStep,
    stepIndex?: number
) => {
    if (savedPositions[nodeId]) {
        return savedPositions[nodeId];
    }

    if (positionMap.has(nodeId)) {
        return positionMap.get(nodeId)!;
    }

    if (step && step.parent_id && step.condition) {
        const parentId = step.parent_id.toString();
        const parentPosition =
            savedPositions[parentId] || positionMap.get(parentId);

        if (parentPosition) {
            const baseY = parentPosition.y + 150;
            const branchWidth = calculateBranchWidth(
                steps,
                step.parent_id,
                step.condition
            );
            const branchOffset =
                step.condition === 'yes' ? -branchWidth / 2 : branchWidth / 2;
            const stepOffset = (stepIndex || 0) * 300;

            return {
                x: parentPosition.x + branchOffset,
                y: baseY + stepOffset,
            };
        }
    }

    return { x: fallbackX, y: fallbackY };
};

const removeDuplicateEdges = (edges: Edge[]): Edge[] => {
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

export {
    calculateBranchWidth,
    calculatePositions,
    getNodePosition,
    removeDuplicateEdges,
};