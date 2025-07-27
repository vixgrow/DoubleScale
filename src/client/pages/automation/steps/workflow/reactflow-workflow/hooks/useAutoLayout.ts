/**
 * External dependencies
 */
import { Node, Edge, Position } from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';

/**
 * Internal dependencies
 */
import { getNodeDimensions } from '../utils/layout-utils';

/**
 * Layout types
 */
export type LayoutAlgorithm = 'elk';
export type LayoutDirection = 'TB';

export interface LayoutOptions {
    algorithm: LayoutAlgorithm;
    direction: LayoutDirection;
    nodeSpacing?: number;
    rankSpacing?: number;
    edgeSpacing?: number;
    preserveViewport?: boolean;
}

interface LayoutResult {
    nodes: Node[];
    edges: Edge[];
}

/**
 * Default layout configuration
 */
const DEFAULT_LAYOUT_OPTIONS: Required<LayoutOptions> = {
    algorithm: 'elk',
    direction: 'TB',
    nodeSpacing: 100,
    rankSpacing: 150,
    edgeSpacing: 50,
    preserveViewport: false,
};

/**
 * Get handle positions based on direction
 */
const getHandlePositions = () => ({
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
});

/**
 * Create ELK graph configuration
 */
const createElkGraph = (nodes: Node[], edges: Edge[], options: Required<LayoutOptions>) => {
    const { nodeSpacing, rankSpacing, edgeSpacing } = options;

    return {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.edgeRouting': 'ORTHOGONAL',
            'elk.spacing.nodeNode': nodeSpacing.toString(),
            'elk.layered.spacing.nodeNodeBetweenLayers': rankSpacing.toString(),
            'elk.spacing.edgeNode': edgeSpacing.toString(),
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
            'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
            'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
            'elk.spacing.portPort': '20',
            'elk.portConstraints': 'FIXED_SIDE',
        },
        children: nodes.map((node) => {
            const { width, height } = getNodeDimensions(node);
            return {
                id: node.id,
                width,
                height,
                layoutOptions: {
                    'elk.position': JSON.stringify({
                        x: node.position?.x || 0,
                        y: node.position?.y || 0,
                    }),
                },
            };
        }),
        edges: edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
        })),
    };
};

/**
 * ELK layout implementation
 */
const layoutWithELK = async (
    nodes: Node[],
    edges: Edge[],
    options: Required<LayoutOptions>
): Promise<LayoutResult> => {
    const elk = new ELK();
    const { sourcePosition, targetPosition } = getHandlePositions();

    const graph = createElkGraph(nodes, edges, options);


    try {
        const layoutedGraph = await elk.layout(graph);

        const layoutedNodes = layoutedGraph.children?.map((layoutedNode) => {
            const originalNode = nodes.find((node) => node.id === layoutedNode.id);
            if (!originalNode) {
                throw new Error(`Node with id ${layoutedNode.id} not found`);
            }

            return {
                ...originalNode,
                sourcePosition,
                targetPosition,
                position: {
                    x: layoutedNode.x || 0,
                    y: layoutedNode.y || 0,
                },
            };
        }) || [];

        return { nodes: layoutedNodes, edges };
    } catch (error) {
        console.error('ELK layout failed:', error);
        throw new Error(`Layout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Auto layout hook
 */
export const useAutoLayout = async (nodes: Node[], edges: Edge[]) => {

    // Early returns for edge cases
    if (nodes.length <= 1) {
        return { nodes, edges };
    }

    try {
        const { nodes: layoutedNodes, edges: layoutedEdges } = await layoutWithELK(
            nodes,
            edges,
            DEFAULT_LAYOUT_OPTIONS
        );
        // Return the layouted results for the caller
        return { nodes: layoutedNodes, edges: layoutedEdges };

    } catch (error) {
        console.error('❌ Auto-layout failed:', error);
        throw error;
    }
}