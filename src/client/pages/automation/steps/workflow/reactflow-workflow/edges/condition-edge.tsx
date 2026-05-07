/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { EdgeProps, BaseEdge } from '@xyflow/react';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@doublescale/client';

interface ConditionEdgeData {
	sourceStep?: AutomationStep;
	targetStep?: AutomationStep;
	condition?: 'yes' | 'no';
	label?: string;
}

const ConditionEdge: React.FC<EdgeProps> = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	style = {},
	data,
	label,
}) => {
	const edgeData = data as ConditionEdgeData;
	const condition = edgeData?.condition || (label === 'Yes' ? 'yes' : 'no');
	const isYes = condition === 'yes';

	// Create symmetric curves for both Yes and No branches
	const branchDirection = isYes ? -1 : 1; // Left for Yes (-1), Right for No (1)

	// Symmetric curve parameters to ensure equal heights
	const horizontalSpread = 60; // How far to spread horizontally from center
	const curveHeight = 80; // Consistent curve height for both branches
	const targetOffset = 20; // Small offset for target positioning

	// Calculate symmetric control points
	const cp1X = sourceX + branchDirection * horizontalSpread;
	const cp1Y = sourceY + curveHeight;

	const cp2X = targetX + branchDirection * targetOffset;
	const cp2Y = targetY - curveHeight;

	// Create symmetric cubic bezier path for both branches
	const edgePath = `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;

	// Enhanced styling based on condition with clear color differentiation
	const edgeStyle = {
		...style,
		stroke: '#D7D7DA', // Unified color for all conditions
		strokeWidth: 1, // Slightly reduced thickness for cleaner look
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		transition: 'all 0.2s ease',
	};

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				style={edgeStyle}
				className={`doublescale-condition-edge doublescale-condition-edge--${condition}`}
			/>
		</>
	);
};

export default ConditionEdge;