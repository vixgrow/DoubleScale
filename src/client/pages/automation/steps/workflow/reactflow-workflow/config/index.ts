/**
 * Constants
 */
const LAYOUT_CONSTANTS = {
    NODE_WIDTH: 280,
    ADD_STEP_WIDTH: 30,
    NODE_YES_NO_WIDTH: 80,
    START_X: 250,
    START_Y: 50,
    INCREMENT_Y: 250,
    EDGE_STROKE_WIDTH: 2,
    CONDITION_EDGE_STROKE_WIDTH: 3,
    MINIMAP_HEIGHT: 120,
    MINIMAP_WIDTH: 200,
    POSITION_THRESHOLD: 2,
} as const;

const SPACING_CONSTANTS = {
    BASE_WIDTH: 200,
    BRANCH_SPACING: 150,
    BASE_SPACING: 200,
    MERGE_SPACING: 120,
    NESTED_SPACING: 150,
    LEVEL_MULTIPLIER: 0.2,
    COMPLEXITY_PADDING: 40,
} as const;

const EDGE_STYLES = {
    DEFAULT: {
        stroke: '#D7D7DA',
        strokeWidth: LAYOUT_CONSTANTS.EDGE_STROKE_WIDTH,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    },
    CONDITION: {
        stroke: '#D7D7DA',
        strokeWidth: LAYOUT_CONSTANTS.CONDITION_EDGE_STROKE_WIDTH,
    },
} as const;


export { LAYOUT_CONSTANTS, SPACING_CONSTANTS, EDGE_STYLES };