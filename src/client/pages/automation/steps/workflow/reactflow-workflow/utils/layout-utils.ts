/**
 * External dependencies
 */
import { Node } from '@xyflow/react';

/**
 * Node type dimensions configuration
 */
export const NODE_DIMENSIONS = {
    trigger: { width: 280, height: 80 },
    action: { width: 280, height: 80 },
    condition: { width: 280, height: 80 },
    goal: { width: 280, height: 80 },
    end_automation: { width: 280, height: 80 },
    add_step: { width: 280, height: 80 },
    default: { width: 280, height: 80 },
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