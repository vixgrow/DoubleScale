/**
 * External dependencies
 */
import { Node, Edge } from '@xyflow/react';

/**
 * Internal dependencies
 */
import type { LayoutAlgorithm, LayoutDirection, LayoutOptions } from '../hooks/useAutoLayout';

/**
 * Default node dimensions for different node types
 */
export const DEFAULT_NODE_DIMENSIONS = {
    trigger: { width: 200, height: 80 },
    action: { width: 220, height: 90 },
    condition: { width: 240, height: 100 },
    goal: { width: 200, height: 80 },
    end_automation: { width: 180, height: 70 },
    add_step: { width: 120, height: 50 },
    default: { width: 200, height: 80 },
};

/**
 * Get node dimensions based on type
 */
export const getNodeDimensions = (node: Node) => {
    const nodeType = node.type || 'default';
    const defaultDims = DEFAULT_NODE_DIMENSIONS[nodeType as keyof typeof DEFAULT_NODE_DIMENSIONS] || DEFAULT_NODE_DIMENSIONS.default;

    return {
        width: node.measured?.width || node.width || defaultDims.width,
        height: node.measured?.height || node.height || defaultDims.height,
    };
};

/**
 * Calculate optimal spacing based on node count and canvas size
 */
export const calculateOptimalSpacing = (nodeCount: number, direction: LayoutDirection) => {
    const baseSpacing = 100;
    const minSpacing = 80;
    const maxSpacing = 200;

    // Adjust spacing based on number of nodes
    let spacing = baseSpacing;
    if (nodeCount > 10) {
        spacing = Math.max(minSpacing, baseSpacing - ((nodeCount - 10) * 5));
    } else if (nodeCount < 5) {
        spacing = Math.min(maxSpacing, baseSpacing + ((5 - nodeCount) * 20));
    }

    // Adjust for direction
    const isHorizontal = direction === 'LR' || direction === 'RL';
    return {
        nodeSpacing: spacing,
        rankSpacing: isHorizontal ? spacing * 1.5 : spacing * 1.2,
        edgeSpacing: spacing * 0.5,
    };
};

/**
 * Get recommended layout algorithm based on graph structure
 */
export const getRecommendedAlgorithm = (nodes: Node[], edges: Edge[]): LayoutAlgorithm => {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    // Check if it's a tree structure (no cycles)
    const isTree = isTreeStructure(nodes, edges);

    // Simple workflows - use Dagre
    if (nodeCount <= 10 && edgeCount <= 15) {
        return 'dagre';
    }

    // Complex workflows - use ELK
    if (nodeCount > 15 || edgeCount > 20) {
        return 'elk';
    }

    // Default to Dagre
    return 'dagre';
};

/**
 * Check if the graph is a tree structure (no cycles)
 */
export const isTreeStructure = (nodes: Node[], edges: Edge[]): boolean => {
    if (edges.length === 0) return true;
    if (edges.length >= nodes.length) return false; // More edges than possible for a tree

    // Find root nodes (nodes with no incoming edges)
    const incomingEdges = new Set(edges.map(edge => edge.target));
    const rootNodes = nodes.filter(node => !incomingEdges.has(node.id));

    // A tree should have exactly one root
    if (rootNodes.length !== 1) return false;

    // Check for cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
        if (recursionStack.has(nodeId)) return true; // Back edge found
        if (visited.has(nodeId)) return false; // Already processed

        visited.add(nodeId);
        recursionStack.add(nodeId);

        // Check all neighbors
        const neighbors = edges
            .filter(edge => edge.source === nodeId)
            .map(edge => edge.target);

        for (const neighbor of neighbors) {
            if (hasCycle(neighbor)) return true;
        }

        recursionStack.delete(nodeId);
        return false;
    };

    return !hasCycle(rootNodes[0].id);
};

/**
 * Get layout presets for quick access
 */
export const LAYOUT_PRESETS: Record<string, LayoutOptions> = {
    'workflow-simple': {
        algorithm: 'dagre',
        direction: 'TB',
        nodeSpacing: 100,
        rankSpacing: 150,
        edgeSpacing: 50,
    },
    'workflow-horizontal': {
        algorithm: 'dagre',
        direction: 'LR',
        nodeSpacing: 120,
        rankSpacing: 180,
        edgeSpacing: 60,
    },
    'complex-vertical': {
        algorithm: 'elk',
        direction: 'TB',
        nodeSpacing: 90,
        rankSpacing: 140,
        edgeSpacing: 45,
    },
    'complex-horizontal': {
        algorithm: 'elk',
        direction: 'LR',
        nodeSpacing: 110,
        rankSpacing: 160,
        edgeSpacing: 55,
    },
};

/**
 * Get smart layout options based on graph analysis
 */
export const getSmartLayoutOptions = (nodes: Node[], edges: Edge[]): LayoutOptions => {
    const algorithm = getRecommendedAlgorithm(nodes, edges);
    const { nodeSpacing, rankSpacing, edgeSpacing } = calculateOptimalSpacing(nodes.length, 'TB');

    return {
        algorithm,
        direction: 'TB',
        nodeSpacing,
        rankSpacing,
        edgeSpacing,
    };
};

/**
 * Validate layout options
 */
export const validateLayoutOptions = (options: LayoutOptions): LayoutOptions => {
    return {
        algorithm: options.algorithm || 'dagre',
        direction: options.direction || 'TB',
        nodeSpacing: Math.max(50, Math.min(300, options.nodeSpacing || 100)),
        rankSpacing: Math.max(80, Math.min(400, options.rankSpacing || 150)),
        edgeSpacing: Math.max(20, Math.min(150, options.edgeSpacing || 50)),
    };
};

/**
 * Get algorithm display name
 */
export const getAlgorithmDisplayName = (algorithm: LayoutAlgorithm): string => {
    switch (algorithm) {
        case 'elk':
            return 'ELK';
        case 'dagre':
        default:
            return 'Dagre';
    }
};

/**
 * Get direction display name
 */
export const getDirectionDisplayName = (direction: LayoutDirection): string => {
    switch (direction) {
        case 'TB':
            return 'Top to Bottom';
        case 'BT':
            return 'Bottom to Top';
        case 'LR':
            return 'Left to Right';
        case 'RL':
            return 'Right to Left';
        default:
            return 'Top to Bottom';
    }
}; 