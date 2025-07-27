/**
 * External dependencies
 */
import { Node } from '@xyflow/react';

/**
 * Node type dimensions configuration
 */
export const NODE_DIMENSIONS = {
    trigger: { width: 200, height: 80 },
    action: { width: 220, height: 90 },
    condition: { width: 200, height: 120 },
    goal: { width: 200, height: 80 },
    end_automation: { width: 180, height: 70 },
    add_step: { width: 120, height: 50 },
    default: { width: 200, height: 80 },
} as const;

/**
 * Get node dimensions based on type with fallback
 */
export const getNodeDimensions = (node: Node) => {
    const nodeType = node.type as keyof typeof NODE_DIMENSIONS || 'default';
    const defaultDims = NODE_DIMENSIONS[nodeType] || NODE_DIMENSIONS.default;

    const obj = {
        width: node.measured?.width || node.width || defaultDims.width,
        height: node.measured?.height || node.height || defaultDims.height,
    }
    return obj;
}; 