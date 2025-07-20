/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * External dependencies
 */
import { Node, Edge, useReactFlow, Position } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import ELK from 'elkjs/lib/elk.bundled.js';

/**
 * Internal dependencies
 */
import { getNodeDimensions } from '../utils/layout-utils';

/**
 * Layout types
 */
export type LayoutAlgorithm = 'dagre' | 'elk';
export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

export interface LayoutOptions {
    algorithm: LayoutAlgorithm;
    direction: LayoutDirection;
    nodeSpacing?: number;
    rankSpacing?: number;
    edgeSpacing?: number;
}

interface LayoutResult {
    nodes: Node[];
    edges: Edge[];
}

/**
 * Default node dimensions
 */
const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 80;

/**
 * Convert direction between different layout engines
 */
const convertDirection = (direction: LayoutDirection, algorithm: LayoutAlgorithm) => {
    switch (algorithm) {
        case 'elk':
            switch (direction) {
                case 'TB': return 'DOWN';
                case 'BT': return 'UP';
                case 'LR': return 'RIGHT';
                case 'RL': return 'LEFT';
                default: return 'DOWN';
            }
        case 'dagre':
        default:
            return direction;
    }
};

/**
 * Get handle positions based on direction
 */
const getHandlePositions = (direction: LayoutDirection) => {
    const isHorizontal = direction === 'LR' || direction === 'RL';

    if (isHorizontal) {
        return {
            sourcePosition: direction === 'LR' ? Position.Right : Position.Left,
            targetPosition: direction === 'LR' ? Position.Left : Position.Right,
        };
    }

    return {
        sourcePosition: direction === 'TB' ? Position.Bottom : Position.Top,
        targetPosition: direction === 'TB' ? Position.Top : Position.Bottom,
    };
};

/**
 * Dagre layout implementation
 */
const layoutWithDagre = async (
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions
): Promise<LayoutResult> => {
    const { direction, nodeSpacing = 100, rankSpacing = 150 } = options;

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: nodeSpacing,
        ranksep: rankSpacing,
        marginx: 20,
        marginy: 20,
    });

    // Add nodes to dagre graph
    nodes.forEach((node) => {
        const { width, height } = getNodeDimensions(node);
        dagreGraph.setNode(node.id, { width, height });
    });

    // Add edges to dagre graph
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Get handle positions
    const { sourcePosition, targetPosition } = getHandlePositions(direction);

    // Update node positions
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const { width, height } = getNodeDimensions(node);

        return {
            ...node,
            sourcePosition,
            targetPosition,
            position: {
                x: nodeWithPosition.x - width / 2,
                y: nodeWithPosition.y - height / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

/**
 * ELK layout implementation
 */
const layoutWithELK = async (
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions
): Promise<LayoutResult> => {
    const { direction, nodeSpacing = 100, rankSpacing = 150, edgeSpacing = 50 } = options;
    const elk = new ELK();
    const elkDirection = convertDirection(direction, 'elk');

    const { sourcePosition, targetPosition } = getHandlePositions(direction);

    const graph = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': elkDirection,
            'elk.edgeRouting': 'ORTHOGONAL',
            'elk.spacing.nodeNode': nodeSpacing.toString(),
            'elk.layered.spacing.nodeNodeBetweenLayers': rankSpacing.toString(),
            'elk.spacing.edgeNode': edgeSpacing.toString(),
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
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
        // Fallback to dagre
        return layoutWithDagre(nodes, edges, { ...options, algorithm: 'dagre' });
    }
};



/**
 * Main layout function
 */
const applyLayout = async (
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions
): Promise<LayoutResult> => {
    const { algorithm } = options;

    switch (algorithm) {
        case 'elk':
            return layoutWithELK(nodes, edges, options);
        case 'dagre':
        default:
            return layoutWithDagre(nodes, edges, options);
    }
};

/**
 * Auto layout hook
 */
export const useAutoLayout = () => {
    const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow();

    const layout = useCallback(async (options: LayoutOptions) => {
        const nodes = getNodes();
        const edges = getEdges();

        if (nodes.length === 0) {
            return;
        }

        if (nodes.length === 1) {
            return;
        }

        try {
            const { nodes: layoutedNodes, edges: layoutedEdges } = await applyLayout(
                nodes,
                edges,
                options
            );

            setNodes(layoutedNodes);
            setEdges(layoutedEdges);

            // Fit view immediately after layout
            setTimeout(() => {
                fitView({ padding: 0.1, duration: 500 });
            }, 50);

        } catch (error) {
            console.error('❌ Layout failed with error:', error);
            throw error;
        }
    }, [getNodes, getEdges, setNodes, setEdges, fitView]);

    return { layout };
}; 