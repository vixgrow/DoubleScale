/**
 * Auto Layout functionality for ReactFlow workflows
 * 
 * This module provides comprehensive auto-layout functionality for ReactFlow
 * workflows including multiple layout algorithms, smart layout selection,
 * and utility functions.
 */

// Hooks
export { useAutoLayout } from '../hooks/useAutoLayout';
export type {
    LayoutAlgorithm,
    LayoutDirection,
    LayoutOptions
} from '../hooks/useAutoLayout';

// Components
export { default as LayoutControls } from '../components/layout-controls';
export { default as LayoutButton } from '../components/layout-button';

// Utilities
export {
    DEFAULT_NODE_DIMENSIONS,
    getNodeDimensions,
    calculateOptimalSpacing,
    getRecommendedAlgorithm,
    isTreeStructure,
    LAYOUT_PRESETS,
    getSmartLayoutOptions,
    validateLayoutOptions,
    getAlgorithmDisplayName,
    getDirectionDisplayName,
} from '../utils/layout-utils';

/**
 * Layout presets for common workflow patterns
 */
export const COMMON_LAYOUTS = {
    // Simple top-to-bottom workflow
    SIMPLE_VERTICAL: {
        algorithm: 'dagre' as const,
        direction: 'TB' as const,
        nodeSpacing: 100,
        rankSpacing: 150,
    },

    // Horizontal workflow for wide screens
    SIMPLE_HORIZONTAL: {
        algorithm: 'dagre' as const,
        direction: 'LR' as const,
        nodeSpacing: 120,
        rankSpacing: 180,
    },

    // Advanced layout for complex workflows
    ADVANCED_LAYOUT: {
        algorithm: 'elk' as const,
        direction: 'TB' as const,
        nodeSpacing: 90,
        rankSpacing: 140,
        edgeSpacing: 45,
    },
} as const;

/**
 * Quick layout functions for common use cases
 */
export const QUICK_LAYOUTS = {

    /** Dagre top-to-bottom */
    DAGRE_TB: 'dagre-tb',

    /** Dagre left-to-right */
    DAGRE_LR: 'dagre-lr',

    /** ELK top-to-bottom */
    ELK_TB: 'elk-tb',

    /** ELK left-to-right */
    ELK_LR: 'elk-lr',

} as const;

export type QuickLayoutType = typeof QUICK_LAYOUTS[keyof typeof QUICK_LAYOUTS]; 