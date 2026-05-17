/**
 * External dependencies
 */
import { Node } from '@xyflow/react';

/**
 * Node type dimensions configuration
 */
export const NODE_DIMENSIONS = {
    trigger: { width: 380, height: 120 },
    action: { width: 380, height: 120 },
    condition: { width: 380, height: 120 },
    goal: { width: 380, height: 120 },
    delay: { width: 380, height: 120 },
    end_automation: { width: 380, height: 56 },
    add_step: { width: 30, height: 30 },
    default: { width: 380, height: 120 },
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